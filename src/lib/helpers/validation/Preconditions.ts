import { BadArgumentError } from "../../errors/BadArgumentError";

export class Preconditions {

    /**
     * Validates that the passed argument is defined.
     * 
     * @param argument given argument
     * @throws Error if the given argument is not defined
     * */
    static assertDefined(argument) {
        // replace with _.isUndefined(argument)
        if (argument === undefined) {
            throw new BadArgumentError('Given argument is not defined');
        }
    }
}