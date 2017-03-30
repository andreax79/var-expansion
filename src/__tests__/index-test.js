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

import {substituteVariables} from '../';

describe('Variables substitution', function() {
  'use strict';
  const line0 = 'la vispa ${name} altro testo $BOH noo$questoXX prova${A}aa';
  const env = {
    name: 'ciccio',
    questoXX: 'aahhh',
    BOH: 1,
    PWD: '/Users/andreax',
    '?': 0,
    f: function() {
      return 295;
    },
    $: 12345,
  };

  it('should accept empty environ', function() {
    const {value, error} = substituteVariables(line0, {});
    expect(value).toEqual('la vispa  altro testo  noo provaaa');
    expect(error).toBeFalsy();
  });

  it('should accept empty strings', function() {
    const {value, error} = substituteVariables('', {});
    expect(value).toEqual('');
    expect(error).toBeFalsy();
  });

  it('should substitute a var', function() {
    const {value, error} = substituteVariables(line0, {env: {BOH: 1}});
    expect(value).toEqual('la vispa  altro testo 1 noo provaaa');
  });

  it('should substitute multiple vars', function() {
    const {value, error} = substituteVariables(line0, {env: env});
    expect(value).toEqual('la vispa ciccio altro testo 1 nooaahhh provaaa');
  });

  it('should substitute ${BOH}', function() {
    const {value, error} = substituteVariables('${BOH}', {env: env});
    expect(value).toEqual('1');
  });

  it('should substitute $BOH', function() {
    const {value, error} = substituteVariables('$BOH', {env: env});
    expect(value).toEqual('1');
  });

  it('should raise error ${BOH', function() {
    const {value, error} = substituteVariables('${BOH', {env: env});
    expect(error).toEqual({
      message: 'unexpected EOF while looking for matching }',
      position: 0,
    });
  });

  it('should preserve spaces', function() {
    const {value, error} = substituteVariables(' $BOH ', {env: {BOH: 'abc'}});
    expect(value).toEqual(' abc ');
  });

  it('should preserve $', function() {
    const {value, error} = substituteVariables('$ ${} $', {});
    expect(value).toEqual('$ ${} $');
  });

  it('should substite $PWD/test', function() {
    const {value, error} = substituteVariables('$PWD/test', {env: env});
    expect(value).toEqual('/Users/andreax/test');
  });

  it('should expand ${PWD:+ciccio}', function() {
    const {value, error} = substituteVariables('${PWD:+ciccio}', {env: env});
    expect(value).toEqual('ciccio');
  });

  it('should expand ${AAA:+bla}', function() {
    const {value, error} = substituteVariables('${AAA:+bla}', {env: env});
    expect(value).toEqual('');
  });

  it('should expand ${PWD:-ciccio}', function() {
    const {value, error} = substituteVariables('${PWD:-ciccio}', {env: env});
    expect(value).toEqual('/Users/andreax');
  });

  it('should expand ${AAA:-bla}', function() {
    const {value, error} = substituteVariables('${AAA:-bla}', {env: env});
    expect(value).toEqual('bla');
  });

  it('should expand ${PWD:#} ${BBB:#}', function() {
    const {value, error} = substituteVariables('${PWD:#} ${BBB:#}', {env: env});
    expect(value).toEqual('14 0');
  });

  it('should expand ${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}', function() {
    const {
      value,
      error,
    } = substituteVariables('${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}', {
      env: env,
    });
    expect(value).toEqual(' newval newval newval');
  });

  it('should expand ${NEWVARx:?} 1 2 3', function() {
    const {value, error} = substituteVariables('${NEWVARx:?} 1 2 3', {env: env});
    expect(error).toEqual({message: 'NEWVARx: parameter null or not set'});
  });

  it('should expand ${NEWVARx:?has not been set} 1 2 3', function() {
    const {value, error} = substituteVariables('${NEWVARx:?has not been set} 1 2 3', {
      env: env,
    });
    expect(error).toEqual({message: 'NEWVARx: has not been set'});
  });

  it('should execute functions', function() {
    const {value, error} = substituteVariables('${f}', {env: env});
    expect(value).toEqual('295');
  });

  it('should expand $? $$', function() {
    const {value, error} = substituteVariables('$? $$', {
      env: env,
      specialVars: ['$', '?'],
    });
    expect(value).toEqual('0 12345');
  });

  it('should accept function as env', function() {
    const env = {
      A: 1,
      B: 2,
    };
    const {value, error} = substituteVariables('$A + $B = 3', {
      env: name => env[name],
    });
    expect(value).toEqual('1 + 2 = 3');
  });
});
