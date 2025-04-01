const typescript = require('rollup-plugin-typescript2');
const del = require('rollup-plugin-delete');

export default [
    {
        input: 'src/index.ts',
        output: [
            { format: 'esm', file: 'dist/index.mjs' }
        ],
        external: ['cc', 'cc_env'],
        plugins: [
            del({ targets: 'dist/*' }),
            typescript(),
        ]
    },
    {
        input: 'src/spriteConfig.ts',
        output: [
            { format: 'cjs', file: 'dist/tool.js' }
        ],
        plugins: [
            typescript(),
        ]
    }
]