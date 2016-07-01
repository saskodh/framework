import {GeneralUtils} from "../../../src/lib/helpers/GeneralUtils";
import {expect} from "chai";

describe('GeneralUtils', function () {

    it('should flatten object', function () {
        // given
        let givenObject = {
            a: { b: 'b', c: { d: 'd', e: 'e' } }
        };

        // when
        let flattened = GeneralUtils.flattenObject(givenObject);

        // then
        expect(flattened.get('a.b')).eq('b');
        expect(flattened.get('a.c.d')).eq('d');
        expect(flattened.get('a.c.e')).eq('e');
    });
    
    it('should work with arrays', function () {
        // given
        let givenObject = {
            array: ['dev', 'prev', 'prep']
        };
        
        // when
        let flattened = GeneralUtils.flattenObject(givenObject);
        
        // then
        expect(flattened.get('array')).eq('dev,prev,prep');
    });
    
    it('should work with numbers, string, booleans..', function () {
        // given
        let givenObject = {
            number: 1,
            boolean: true,
            string: 'string'
        };
        
        // when
        let flattened = GeneralUtils.flattenObject(givenObject);
        
        // then
        expect(flattened.get('number')).eq(1);
        expect(flattened.get('boolean')).eq(true);
        expect(flattened.get('string')).eq('string');
    });

});