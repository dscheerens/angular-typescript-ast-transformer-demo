import { readFileSync } from 'fs';
import { addTransformer } from 'ngx-ast-transform';
import { Configuration } from 'webpack';

import { stringSubstitute } from './string-substitute.transformer';
import { typeGuardGenerator } from './type-guard-generator';

export default function(webpackConfig: Configuration): Configuration {
    addTransformer(webpackConfig, stringSubstitute({
        package: loadPackageInfo(),
        build: {
            timestamp: new Date().toISOString(),
        },
    }));

    addTransformer(webpackConfig, typeGuardGenerator());

    return webpackConfig;
}

function loadPackageInfo(): unknown {
    try {
        return JSON.parse(readFileSync('./package.json', { encoding: 'UTF8' }));
    } catch {
        return undefined;
    }
}
