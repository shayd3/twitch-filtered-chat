module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "USE_DIST": "readonly",
        "Util": "readonly",
        "Twitch": "readonly",
        "TwitchClient": "readonly",
        "TwitchEvent": "readonly",
        "TwitchChatEvent": "readonly",
        "TwitchSubEvent": "readonly",
        "HTMLGenerator": "readonly",
        "Plugins": "readonly",
        "Content": "readonly",
        "ChatCommands": "readwrite",
        "InitChatCommands": "readonly",
        "ParseLayout": "readonly",
        "FormatLayout": "readonly",
        "AllColors": "readonly",
        "CSSCheerStyles": "readonly",
        "GetCheerStyle": "readonly",
        "client_main": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "no-shadow": "warn",
        "no-trailing-spaces": "warn",
        "eqeqeq": "warn",
        'no-unused-vars': ['warn', {
            args: 'none',
            ignoreRestSiblings: true
        }]
    },
    "overrides": [
        {
            "files": ["main.js"],
            "rules": {
                "no-console": "off"
            }
        }
    ]
};
