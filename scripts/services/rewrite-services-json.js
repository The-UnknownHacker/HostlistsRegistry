const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const { validateSvgIcons } = require('./validate-svg-icons');

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} dirPath - The path to the directory containing YAML files.
 * @param {string[]} serviceFileNames - An array of file names to read and parse.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of objects of YAML content.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const getServiceFilesContent = async (dirPath, serviceFileNames) => {
    const invalidYmlFiles = [];
    // Reads data from a yml file and writes it to an object
    const serviceFileContents = await Promise.all(
        serviceFileNames.map(async (fileName) => {
            try {
                // Set the path to the file
                const serviceFilePath = path.resolve(__dirname, dirPath, `${fileName}${YML_FILE_EXTENSION}`);
                // Read the file and parse the content
                const fileChunk = await fs.readFile(serviceFilePath, 'utf-8');
                const fileData = yaml.load(fileChunk);
                return fileData;
            } catch (error) {
                // Collect the names of the invalid files
                invalidYmlFiles.push(fileName);
                return null;
            }
        }),
    );
    // If there are invalid files, throw an error
    if (invalidYmlFiles.length > 0) {
        throw new Error(`Error while reading YML files: ${invalidYmlFiles.join(', ')}`);
    }
    // Return the array of objects with YML files content if there are no errors
    return serviceFileContents;
};

/**
 * Overwrites the content of a result file with combined service data.
 *
 * @param {string} inputDirPath - The path to the directory containing service files.
 * @param {string} resultFilePath - The path to the result file to be overwritten.
 * @param {string[]} serviceFileNames - An array of service file names to read content from.
 * @returns {Promise<void>} - A Promise that resolves when the operation is complete.
 */
const overwriteResultFile = async (inputDirPath, resultFilePath, serviceFileNames) => {
    // Array with YML files content.
    const combinedServiceContent = await getServiceFilesContent(inputDirPath, serviceFileNames);
    // Validate SVG icons. If the svg icon is not valid, an error is thrown.
    validateSvgIcons(combinedServiceContent);
    // Object to store the blocked services JSON file content.
    const servicesData = {};
    // Write the sorted services array into the blocked_services key.
    servicesData.blocked_services = combinedServiceContent.sort();
    // Rewrite services JSON file.
    await fs.writeFile(resultFilePath, JSON.stringify(servicesData, null, 2));
};

module.exports = {
    overwriteResultFile,
};
