module.exports = {
    "roots": [
        "<rootDir>"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        "<rootDir>/imports/",
      ]
}
