/*
 * Copyright (c) 2015, Andrea Bonomi <andrea.bonomi@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for
 * any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * @flow
 */

export type Result = {
  value: ?string,
  error: ?{position?: number, message: string},
};

export type Options = {
  env?: Env | EnvResolver,
  specialVars?: string[],
  ignoreErrors?: boolean,
};

type Context = {
  env: EnvResolver,
  cachedEnv: Env,
  specialVars?: string[],
  ignoreErrors: boolean,
};

type Value = void | null | string | number | Function;

type Env = {[name: string]: Value};

type EnvResolver = (name: string) => Value;

/**
 * Substitute all the occurrences of environ variables in a text
 *
 * @param {String} text - Text with variables to be substituted
 * @param {Object|Function} options.env - Environ variables
 * @param {String|array} options.specialVars - List of special (single char) variables
 */
export function substituteVariables(text: string, options: Options): Result {
  const env: EnvResolver = typeof options.env === 'function'
    ? ((options.env: any): EnvResolver)
    : createResolverFromMapping(options.env != null ? options.env : {});
  const context: Context = {
    env,
    cachedEnv: {},
    specialVars: options.specialVars,
    ignoreErrors: Boolean(options.ignoreErrors),
  };
  const {value, error} = substituteVariablesInternal(text, 0, '', context);
  return {value: String(value), error};
}

function createResolverFromMapping(obj): EnvResolver {
  return name => obj[name];
}

function resolveVariable(context: Context, name: string) {
  if (name in context.cachedEnv) {
    let value = context.cachedEnv[name];
    if (typeof value === 'function') {
      value = value();
    }
    return value;
  } else {
    let value = context.env(name);
    context.cachedEnv[name] = value;
    if (typeof value === 'function') {
      value = value();
    }
    return value;
  }
}

function substitueVariable(variable, context: Context) {
  var value = null;
  var error = null;
  var s = variable.split(':', 2);
  if (s.length == 2) {
    const [name, modifier] = s;
    value = resolveVariable(context, name);
    if (modifier[0] == '+') {
      // Substitute replacement, but only if variable is defined and nonempty. Otherwise, substitute nothing
      value = value ? modifier.substring(1) : '';
    } else if (modifier[0] == '-') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead
      value = value || modifier.substring(1);
    } else if (modifier[0] == '#') {
      // Substitute with the length of the value of the variable
      value = value !== undefined ? String(value).length : 0;
    } else if (modifier[0] == '=') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead and set the variable to default
      if (!value) {
        value = modifier.substring(1);
        context.cachedEnv[name] = value;
      }
    } else if (modifier[0] == '?') {
      // If variable is defined and not empty, substitute its value. Otherwise, print message as an error message.
      if (!value) {
        if (modifier.length > 1) {
          return {error: {message: name + ': ' + modifier.substring(1)}, value: null};
        } else {
          return {error: {message: name + ': parameter null or not set'}, value: null};
        }
      }
    }
  } else {
    value = resolveVariable(context, variable);
  }
  return {error, value};
}

function substituteVariablesInternal(str, position, result, context: Context) {
  if (position == -1 || !str) {
    return {value: result, error: null};
  } else {
    var index = str.indexOf('$', position);

    if (index == -1) {
      // no $
      result += str.substring(position);
      position = -1;
      return {value: result, error: null};
    } else {
      // $ found
      var variable;
      var endIndex;
      result += str.substring(position, index);

      if (str.charAt(index + 1) == '{') {
        // ${VAR}
        endIndex = str.indexOf('}', index);
        if (endIndex == -1) {
          // '}' not found
          if (context.ignoreErrors) {
            variable = str.substring(index + 2);
          } else {
            return {
              value: result,
              error: {position, message: 'unexpected EOF while looking for matching }'},
            };
          }
        } else {
          // '}' found
          variable = str.substring(index + 2, endIndex);
          endIndex++;
        }
        if (!variable) {
          result += '${}';
        }
      } else {
        // $VAR
        index++; // skip $
        endIndex = -1;
        // special single char vars
        if (context.specialVars && context.specialVars.indexOf(str[index]) != -1) {
          variable = str[index];
          endIndex = index + 1;
        } else {
          // search for var end
          for (var i = index, len = str.length; i < len; i++) {
            var code = str.charCodeAt(i);
            if (
              !(code > 47 && code < 58) && // numeric
              !(code > 64 && code < 91) && // upper alpha
              code !== 95 && // underscore
              !(code > 96 && code < 123)
            ) {
              // lower alpha
              endIndex = i;
              break;
            }
          }

          if (endIndex == -1) {
            // delimeter not found
            variable = str.substring(index);
          } else {
            // delimeted found
            variable = str.substring(index, endIndex);
          }
        }
        if (!variable) {
          result += '$';
        }
      }
      position = endIndex;
      if (!variable) {
        return substituteVariablesInternal(str, position, result, context);
      } else {
        var {error, value} = substitueVariable(variable, context);
        if (error && !context.ignoreErrors) {
          return {error, value};
        }
        if (value != null) {
          result += String(value);
        }
        return substituteVariablesInternal(str, position, result, context);
      }
    }
  }
}
