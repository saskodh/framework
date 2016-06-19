import {GeneralUtils} from "../../../src/lib/helpers/GeneralUtils";
import {expect} from "chai";

describe('GeneralUtils', function () {

    it('should flatten object', function () {
        // given
        let givenObject = {
            a: { b: 'b', c: { d: 'd', e: 'e' } },
            o: 'o'
        };

        // when
        let flattened = GeneralUtils.flattenObject(givenObject);

        // then
        expect(flattened.get('a.b')).eq('b');
        expect(flattened.get('a.c.d')).eq('d');
        expect(flattened.get('a.c.e')).eq('e');
        expect(flattened.get('o')).eq('o');
    });

});