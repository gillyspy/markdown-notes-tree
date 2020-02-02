const dedent = require("dedent");

const fileContentsFunctions = require("./file-contents");

describe("file contents functions", () => {
    const endOfLine = "\n";

    describe("getTitleFromMarkdownContents", () => {
        test("it should support CRLF line endings", () => {
            const contents = "# test" + "\r\n" + "second line";
            expect(fileContentsFunctions.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should support LF line endings", () => {
            const contents = "# test" + "\n" + "second line";
            expect(fileContentsFunctions.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should support CR line endings", () => {
            const contents = "# test" + "\r" + "second line";
            expect(fileContentsFunctions.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should return undefined if the first line doesn't have a title", () => {
            const contents = "some non-title content";
            expect(fileContentsFunctions.getTitleFromMarkdownContents(contents)).toBeUndefined();
        });
    });

    describe("getMarkdownForTree", () => {
        const tree = [
            {
                isDirectory: true,
                title: "sub1",
                filename: "sub1",
                children: [
                    {
                        isDirectory: false,
                        title: "Title for file1a",
                        filename: "file1a.md"
                    }
                ]
            }
        ];

        test("it should generate a tree with proper formatting and indentation", () => {
            const expected =
                "- [**sub1**](sub1)" + endOfLine + "    - [Title for file1a](sub1/file1a.md)";

            const result = fileContentsFunctions.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: false,
                useTabs: false
            });

            expect(result).toEqual(expected);
        });

        test("it should allow linking directly to subdirectory README files", () => {
            const expected =
                "- [**sub1**](sub1/README.md)" +
                endOfLine +
                "    - [Title for file1a](sub1/file1a.md)";

            const result = fileContentsFunctions.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: true,
                useTabs: false
            });

            expect(result).toEqual(expected);
        });

        test("it should allow using tabs instead of spaces", () => {
            const expected =
                "- [**sub1**](sub1)" + endOfLine + "\t- [Title for file1a](sub1/file1a.md)";

            const result = fileContentsFunctions.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: false,
                useTabs: true
            });

            expect(result).toEqual(expected);
        });
    });

    describe("getNewMainReadmeFileContents", () => {
        test("it should handle current contents without a tree", () => {
            const currentContents = "some content";

            const result = fileContentsFunctions.getNewMainReadmeFileContents(
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`some content
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree
                
                <!-- auto-generated notes tree ends here -->`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should handle current contents with a tree", () => {
            const currentContents =
                dedent(`some content
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree
                
                <!-- auto-generated notes tree ends here -->
                
                content after tree`) + endOfLine;

            const result = fileContentsFunctions.getNewMainReadmeFileContents(
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`some content
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree
                
                <!-- auto-generated notes tree ends here -->
                
                content after tree`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should handle current contents with a tree at the end missing the end marker (as generated by older version)", () => {
            const currentContents =
                dedent(`some content
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree`) + endOfLine;

            const result = fileContentsFunctions.getNewMainReadmeFileContents(
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`some content
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree
                
                <!-- auto-generated notes tree ends here -->`) + endOfLine;

            expect(result).toBe(expected);
        });
    });

    describe("getDirectoryReadmeFileContents", () => {
        test("it should return the contents with marker, title and tree", () => {
            const result = fileContentsFunctions.getDirectoryReadmeFileContents(
                "name",
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name
                
                markdownForTree`) + endOfLine;

            expect(result).toBe(expected);
        });
    });
});
