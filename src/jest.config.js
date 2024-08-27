module.exports = {
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: 'src',
    testMatch: ['**/*.spec.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
};
