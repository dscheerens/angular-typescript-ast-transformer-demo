import { addTransformer } from 'ngx-ast-transform';
import { Configuration } from 'webpack';

import * as packageInfo from '../package.json';

import { simplifyNumberLiteralExpressions } from './simplify-number-literal-expressions.transformer';
import { stringSubstitute } from './string-substitute.transformer';
import { typeGuardGenerator } from './type-guard-generator';

export default function(webpackConfig: Configuration): Configuration {
    addTransformer(webpackConfig, simplifyNumberLiteralExpressions());

    addTransformer(webpackConfig, stringSubstitute({
        package: packageInfo,
        build: {
            timestamp: new Date().toISOString(),
        },
    }));

    addTransformer(webpackConfig, typeGuardGenerator());

    return webpackConfig;
}
