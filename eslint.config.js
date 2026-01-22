// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import reactJsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js'

export default tseslint.config(
    eslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            reactRecommended,
            reactJsxRuntime,
        ],
        rules: {
            "@typescript-eslint/no-confusing-void-expression": [
                "error",
                {
                    "ignoreArrowShorthand": true,
                    "ignoreVoidOperator": true,
                }
            ],
          "@typescript-eslint/restrict-template-expressions": [
            "error",
            {
              allowAny: true,
              allowBoolean: true,
              allowNullish: true,
              allowNumber: true,
              allowRegExp: true,
            }
          ]
        },
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    }
);
