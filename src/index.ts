import { Walker } from "./walker";

/**
 * Since this file needs to be injected before any other code runs,
 * abuse setters to apply these monkeypatches once their targets exist.
 */
function decorate<T, K extends keyof T>(
  obj: T,
  prop: K,
  func: (prop: T[K]) => T[K]
) {
  var existingValue: T[K] = func(obj[prop]);

  Object.defineProperty(obj, prop, {
    enumerable: true,
    configurable: true,
    get() {
      return existingValue;
    },
    set(newValue) {
      if (!existingValue) {
        existingValue = func(newValue);
      }
      return existingValue;
    },
  });
}

const odooModules = /@odoo-module\s+alias=(?<module>.+)\b/g;
const odooDefine = /odoo\s*\.define\s*\(\s*['"](?<classic>.+)['"]/;

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const pwd = info.project.getCurrentDirectory();
    let cache: Map<string, { loc: string; classic: boolean }> = new Map();

    function _info(msg: string) {
      info.project.projectService.logger.info("[odoo] " + msg);
    }

    function updateCache(file: string) {
      _info(`File update: ${file}`);
      const contents = ts.sys.readFile(file);
      if (!contents) {
        for (const [key, removed] of cache.entries()) {
          if (file == removed.loc) {
            _info(`File removal: ${file}`);
            cache.delete(key);
            info.project.refreshDiagnostics();
            return;
          }
        }
      } else {
        let match;
        if ((match = odooModules.exec(contents) || odooDefine.exec(contents))) {
          const groups = match.groups!;
          const alias = groups.module || groups.classic;
          const classic = !!groups.classic;
          _info(`Found alias ${alias} to ${file} (classic=${classic})`);
          cache.set(alias, { loc: file, classic });
          info.project.refreshDiagnostics();
        }
      }
    }

    const walker = new Walker(ts, pwd);
    for (const file of walker) {
      updateCache(file);
    }
    _info(`Init done: ${JSON.stringify(cache)}`);

    // TODO: Current behavior is that as long as "path" is not open,
    // it will be possible to deceive the typechecker into using this
    // virtual file. When it is opened by VSCode, however,
    // it bypasses this function and therefore emits errors.
    decorate(ts.sys, "readFile", (readFile) => {
      return (path, encoding) => {
        _info(`Reading file ${path}`);
        const file = readFile(path, encoding);
        if (file) {
          for (const { loc, classic } of cache.values()) {
            if (path == loc && classic) {
              const idx = file.lastIndexOf("return");
              if (idx != -1) {
                const replacement =
                  file.substring(0, idx) +
                  "module.exports=" +
                  file.substring(idx + 6 /* 'return'.length */);
                _info(`Replacement: ${replacement}`);
                return replacement;
              }
            }
          }
        }
        return file;
      };
    });

    decorate(ts, "resolveModuleName", (resolve) => {
      return (name, file, opts, host, cache_, redirected, mode) => {
        if (cache.has(name)) {
          return ts.classicNameResolver(
            cache.get(name)!.loc,
            file,
            opts,
            host,
            cache_,
            redirected
          );
        }
        return resolve(name, file, opts, host, cache_, redirected, mode);
      };
    });

    const getCompletionsAtPosition =
      info.languageService.getCompletionsAtPosition;
    info.languageService.getCompletionsAtPosition = (
      file,
      pos,
      opts,
      fopts
    ) => {
      const comps = getCompletionsAtPosition(file, pos, opts, fopts);
      if (comps) {
        for (const name of cache.keys()) {
          comps.entries.push({
            name,
            kind: ts.ScriptElementKind.externalModuleName,
            sortText: name,
            isImportStatementCompletion: true,
          });
        }
      }
      return comps;
    };

    ts.sys.watchDirectory!(pwd, updateCache, true, {
      // needed so that ts.sys.readFile doesn't return null for existent file
      synchronousWatchDirectory: true,
    });

    return info.languageService;
  }
  return { create };
}

export = init;
