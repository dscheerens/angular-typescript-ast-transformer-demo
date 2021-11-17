import { readFileSync } from 'fs';
import { Configuration } from 'webpack';

import { addTransformer } from './add-transformer';
import { stringSubstitute } from './string-substitute.transformer';

export default function(webpackConfig: Configuration): Configuration {
    addTransformer(webpackConfig, stringSubstitute({
        package: loadPackageInfo(),
        build: {
            timestamp: new Date().toISOString(),
        },
    }));

    return webpackConfig;
}

function loadPackageInfo(): unknown {
    try {
        return JSON.parse(readFileSync('./package.json', { encoding: 'UTF8' }));
    } catch {
        return undefined;
    }
}
