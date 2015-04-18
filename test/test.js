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
 */

/* jshint node: true, strict: true */

var should = require('should');
var varExpansion = require('../');
var substiteVariables = varExpansion.substiteVariables;

describe('Variables substitution',function(){
    "use strict";

    var line0 = "la vispa ${name} altro testo $BOH noo$questoXX prova${A}aa";
    var env =  { name: 'ciccio', questoXX: 'aahhh', BOH: 1, PWD: '/Users/andreax', '?': 0, f: function() { return 295; }, $: 12345 }; 

    it('should accept empty environ',function(done) {
        substiteVariables(line0, {}, function(err, value) {
            value.should.be.equal("la vispa  altro testo  noo provaaa");
            done();
        });
    });
    
    it('should accept empty strings',function(done) {
        substiteVariables('', {}, function(err, value) {
            value.should.be.equal('');
            done();
        });
    });

    it('should substitute a var',function(done) {
        substiteVariables(line0, { env: { BOH: 1 } }, function(err, value) {
            value.should.be.equal('la vispa  altro testo 1 noo provaaa');
            done();
        });
    });
    
    it('should substitute multiple vars',function(done) {
        substiteVariables(line0, { env: env }, function(err, value) {
            value.should.be.equal('la vispa ciccio altro testo 1 nooaahhh provaaa');
            done();
        });
    });
    
    it('should substitute ${BOH}',function(done) {
        substiteVariables('${BOH}', { env: env }, function(err, value) {
            value.should.be.equal('1');
            done();
        });
    });
    
    it('should substitute $BOH',function(done) {
        substiteVariables('$BOH', { env: env }, function(err, value) {
            value.should.be.equal('1');
            done();
        });
    });
 
    it('should raise error ${BOH',function(done) {
        substiteVariables('${BOH', { env: env }, function(err, value) {
            err.should.be.not.null;
            done();
        });
    });   

    it('should preserve spaces',function(done) {
        substiteVariables(' $BOH ', { env: { BOH: 'abc' } }, function(err, value) {
            value.should.be.equal(' abc ');
            done();
        });
    });
    
    it('should preserve $',function(done) {
        substiteVariables('$ ${} $', { }, function(err, value) {
            value.should.be.equal('$ ${} $');
            done();
        });
    });
    
    it('should substite $PWD/test',function(done) {
        substiteVariables('$PWD/test', { env: env }, function(err, value) {
            value.should.be.equal('/Users/andreax/test');
            done();
        });
    });
    
    it('should expand ${PWD:+ciccio}',function(done) {
        substiteVariables('${PWD:+ciccio}', { env: env }, function(err, value) {
            value.should.be.equal('ciccio');
            done();
        });
    });
    
    it('should expand ${AAA:+bla}',function(done) {
        substiteVariables('${AAA:+bla}', { env: env }, function(err, value) {
            value.should.be.equal('');
            done();
        });
    });
    
    it('should expand ${PWD:-ciccio}',function(done) {
        substiteVariables('${PWD:-ciccio}', { env: env }, function(err, value) {
            value.should.be.equal('/Users/andreax');
            done();
        });
    });
    
    it('should expand ${AAA:-bla}',function(done) {
        substiteVariables('${AAA:-bla}', { env: env }, function(err, value) {
            value.should.be.equal('bla');
            done();
        });
    });
    
    it('should expand ${PWD:#} ${BBB:#}',function(done) {
        substiteVariables('${PWD:#} ${BBB:#}', { env: env }, function(err, value) {
            value.should.be.equal('14 0');
            done();
        });
    });

    it('should expand ${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}',function(done) {
        substiteVariables('${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}', { env: env }, function(err, value) {
            value.should.be.equal(' newval newval newval');
            done();
        });
    });
    
    it('should expand ${NEWVARx:?} 1 2 3',function(done) {
        substiteVariables('${NEWVARx:?} 1 2 3', { env: env }, function(err, value) {
            (err).should.be.equal('NEWVARx: parameter null or not set');
            done();
        });
    });
    
    it('should expand ${NEWVARx:?has not been set} 1 2 3',function(done) {
        substiteVariables('${NEWVARx:?has not been set} 1 2 3', { env: env }, function(err, value) {
            (err).should.be.equal('NEWVARx: has not been set');
            done();
        });
    });

    it('should execute functions',function(done) {
        substiteVariables('${f}', { env: env }, function(err, value) {
            value.should.be.equal('295');
            done();
        });
    });

    it('should expand $? $$',function(done) {
        substiteVariables('$? $$', { env: env, specialVars: ['$', '?'] }, function(err, value) {
            value.should.be.equal('0 12345');
            done();
        });
    });
});
