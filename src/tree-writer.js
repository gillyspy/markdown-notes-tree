"use strict";

const path = require("path");
const fs = require("fs");

const pathUtils = require("./path-utils");
const fileContents = require("./file-contents");

module.exports = { writeTreeToMainReadme, writeTreesForDirectories };

function writeTreeToMainReadme(tree, endOfLine, options) {
    const mainReadmePath = pathUtils.getAbsolutePath("README.md");
    const currentContents = fs.readFileSync(mainReadmePath, { encoding: "utf-8" });
    const markdownForTree = fileContents.getMarkdownForTree(tree, endOfLine, options);

    const newContents = fileContents.getNewMainReadmeContents(
        currentContents,
        markdownForTree,
        endOfLine
    );

    fs.writeFileSync(mainReadmePath, newContents, { encoding: "utf-8" });
}

function writeTreesForDirectories(mainTree, endOfLine, options, logger) {
    for (const treeNode of mainTree) {
        if (treeNode.isDirectory) {
            writeTreesForDirectory(
                [treeNode.filename],
                treeNode.filename,
                treeNode.children,
                endOfLine,
                options,
                logger
            );
        }
    }
}

function writeTreesForDirectory(pathParts, name, treeForDirectory, endOfLine, options, logger) {
    writeTreeToDirectoryReadme(pathParts, name, treeForDirectory, endOfLine, options, logger);

    for (const treeNode of treeForDirectory) {
        if (treeNode.isDirectory) {
            writeTreesForDirectory(
                [...pathParts, treeNode.filename],
                treeNode.filename,
                treeNode.children,
                endOfLine,
                options,
                logger
            );
        }
    }
}

function writeTreeToDirectoryReadme(pathParts, name, treeForDirectory, endOfLine, options, logger) {
    const markdownForTree = fileContents.getMarkdownForTree(treeForDirectory, endOfLine, options);
    const contents = fileContents.getDirectoryReadmeContents(name, markdownForTree, endOfLine);

    const filePathParts = [...pathParts, "README.md"];
    const relativeFilePath = path.join(...filePathParts);
    const absoluteFilePath = pathUtils.getAbsolutePath(relativeFilePath);

    logger(`Writing to ${absoluteFilePath}`);
    fs.writeFileSync(absoluteFilePath, contents, { encoding: "utf-8" });
}