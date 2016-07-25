import {Preconditions} from "./validation/Preconditions";

export class TypeUtils {

    /**
     * Checks if the given type is the same or extends the given comparison type.
     *
     * @param givenType the given type
     * @param comparisonType the comparison type
     * @returns Boolean
     * @throws Error if any of the arguments is undefined
     * */
    static isA(givenType, comparisonType): boolean {
        Preconditions.assertDefined(givenType);
        Preconditions.assertDefined(comparisonType);

        if (givenType === comparisonType) {
            return true;
        }
        return givenType.prototype instanceof comparisonType;
    }
}
