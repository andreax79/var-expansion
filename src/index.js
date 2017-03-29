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
  env?: {
    [name: string]: string | number | Function,
  },
  specialVars?: string[],
};

type StrictOptions = {
  env: {
    [name: string]: string | number | (() => string | number),
  },
  specialVars?: string[],
};

/**
 * Substitute all the occurrences of environ variables in a text
 *
 * @param {String} text - Text with variables to be substituted
 * @param {object} options.env - Environ variables
 * @param {String|array} options.specialVars - List of special (single char) variables
 */
export function substituteVariables(text: string, options: Options): Result {
  const strictOptions = {env: {}, ...options};
  const {value, error} = substituteVariablesInternal(text, 0, '', strictOptions);
  return {value: String(value), error};
}

function substitueVariable(variable, options: StrictOptions) {
  var value = null;
  var error = null;
  var s = variable.split(':', 2);
  if (s.length == 2) {
    value = options.env[s[0]];
    if (typeof value == 'function') {
      value = value();
    }
    if (s[1][0] == '+') {
      // Substitute replacement, but only if variable is defined and nonempty. Otherwise, substitute nothing
      value = value ? s[1].substring(1) : '';
    } else if (s[1][0] == '-') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead
      value = value || s[1].substring(1);
    } else if (s[1][0] == '#') {
      // Substitute with the length of the value of the variable
      value = value !== undefined ? String(value).length : 0;
    } else if (s[1][0] == '=') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead and set the variable to default
      if (!value) {
        value = s[1].substring(1);
        options.env[s[0]] = value;
      }
    } else if (s[1][0] == '?') {
      // If variable is defined and not empty, substitute its value. Otherwise, print message as an error message.
      if (!value) {
        if (s[1].length > 1) {
          return {error: {message: s[0] + ': ' + s[1].substring(1)}, value: null};
        } else {
          return {error: {message: s[0] + ': parameter null or not set'}, value: null};
        }
      }
    }
  } else {
    value = options.env[variable];
    if (typeof value == 'function') {
      value = value();
    }
  }
  return {error, value};
}

function substituteVariablesInternal(str, position, result, options: StrictOptions) {
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
          if (options.ignoreErrors) {
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
        if (options.specialVars && options.specialVars.indexOf(str[index]) != -1) {
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
        return substituteVariablesInternal(str, position, result, options);
      } else {
        var {error, value} = substitueVariable(variable, options);
        if (error && !options.ignoreErrors) {
          return {error, value};
        }
        if (value != null) {
          result += String(value);
        }
        return substituteVariablesInternal(str, position, result, options);
      }
    }
  }
}
