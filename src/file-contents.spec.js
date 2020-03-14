"use strict";

const dedent = require("dedent");

const fileContents = require("./file-contents");

describe("fileContents", () => {
    const endOfLine = "\n";

    describe("getTitleFromMarkdownContents", () => {
        test("it should support CRLF line endings", () => {
            const contents = "# test" + "\r\n" + "second line";
            expect(fileContents.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should support LF line endings", () => {
            const contents = "# test" + "\n" + "second line";
            expect(fileContents.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should support CR line endings", () => {
            const contents = "# test" + "\r" + "second line";
            expect(fileContents.getTitleFromMarkdownContents(contents)).toBe("test");
        });

        test("it should return undefined if the first line doesn't have a title", () => {
            const contents = "some non-title content";
            expect(fileContents.getTitleFromMarkdownContents(contents)).toBeUndefined();
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
            const result = fileContents.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: false,
                useTabs: false
            });

            const expected =
                "- [**sub1**](sub1)" + endOfLine + "    - [Title for file1a](sub1/file1a.md)";

            expect(result).toEqual(expected);
        });

        test("it should allow linking directly to subdirectory README files", () => {
            const result = fileContents.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: true,
                useTabs: false
            });

            const expected =
                "- [**sub1**](sub1/README.md)" +
                endOfLine +
                "    - [Title for file1a](sub1/file1a.md)";

            expect(result).toEqual(expected);
        });

        test("it should allow using tabs instead of spaces", () => {
            const result = fileContents.getMarkdownForTree(tree, endOfLine, {
                linkToSubdirectoryReadme: false,
                useTabs: true
            });

            const expected =
                "- [**sub1**](sub1)" + endOfLine + "\t- [Title for file1a](sub1/file1a.md)";

            expect(result).toEqual(expected);
        });

        describe("for a tree with description", () => {
            const treeIncludingFolderDescription = [
                {
                    isDirectory: true,
                    title: "sub1",
                    description: "description1",
                    filename: "sub1",
                    children: [
                        {
                            isDirectory: true,
                            title: "sub1a",
                            description: "description1a",
                            filename: "sub1a",
                            children: []
                        },
                        {
                            isDirectory: false,
                            title: "Title for file1a",
                            filename: "file1a.md"
                        }
                    ]
                }
            ];

            test("it should include the description", () => {
                const result = fileContents.getMarkdownForTree(
                    treeIncludingFolderDescription,
                    endOfLine,
                    {
                        linkToSubdirectoryReadme: false,
                        subdirectoryDescriptionOnNewLine: false,
                        useTabs: false
                    }
                );

                const expected =
                    "- [**sub1**](sub1) - description1" +
                    endOfLine +
                    "    - [**sub1a**](sub1/sub1a) - description1a" +
                    endOfLine +
                    "    - [Title for file1a](sub1/file1a.md)";

                expect(result).toEqual(expected);
            });

            test("it should allow putting the description on a new line", () => {
                const result = fileContents.getMarkdownForTree(
                    treeIncludingFolderDescription,
                    endOfLine,
                    {
                        linkToSubdirectoryReadme: false,
                        subdirectoryDescriptionOnNewLine: true,
                        useTabs: false
                    }
                );

                const expected =
                    "- [**sub1**](sub1)  " +
                    endOfLine +
                    "    description1" +
                    endOfLine +
                    "    - [**sub1a**](sub1/sub1a)  " +
                    endOfLine +
                    "        description1a" +
                    endOfLine +
                    "    - [Title for file1a](sub1/file1a.md)";

                expect(result).toEqual(expected);
            });
        });
    });

    describe("getNewMainReadmeContents", () => {
        test("it should handle current contents without a tree", () => {
            const currentContents = "some content";

            const result = fileContents.getNewMainReadmeContents(
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

            const result = fileContents.getNewMainReadmeContents(
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

            const result = fileContents.getNewMainReadmeContents(
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

        test("it should fail for current contents having an end marker before start marker", () => {
            const currentContents =
                dedent(`some content

                <!-- auto-generated notes tree ends here -->
                
                <!-- auto-generated notes tree starts here -->
                
                markdownForTree`) + endOfLine;

            expect(() =>
                fileContents.getNewMainReadmeContents(currentContents, "markdownForTree", endOfLine)
            ).toThrow("Invalid file structure: tree end marker found before tree start marker");
        });
    });

    describe("getNewDirectoryReadmeContents", () => {
        test("it should handle empty current contents", () => {
            const currentContents = "";

            const result = fileContents.getNewDirectoryReadmeContents(
                "name",
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should handle current contents without description markers (as generated by older version)", () => {
            const currentContents =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name
                
                markdownForTree`) + endOfLine;

            const result = fileContents.getNewDirectoryReadmeContents(
                "name",
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should handle current contents without description between markers", () => {
            const currentContents =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            const result = fileContents.getNewDirectoryReadmeContents(
                "name",
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should handle current contents with description between markers", () => {
            const currentContents =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                This is a description.

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            const result = fileContents.getNewDirectoryReadmeContents(
                "name",
                currentContents,
                "markdownForTree",
                endOfLine
            );

            const expected =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description starts here -->

                This is a description.

                <!-- optional markdown-notes-tree directory description ends here -->
                
                markdownForTree`) + endOfLine;

            expect(result).toBe(expected);
        });

        test("it should fail for current contents having invalid markers", () => {
            const currentContents =
                dedent(`<!-- this entire file is auto-generated -->
                
                # name

                <!-- optional markdown-notes-tree directory description ends here -->

                <!-- optional markdown-notes-tree directory description starts here -->
                
                markdownForTree`) + endOfLine;

            expect(() =>
                fileContents.getNewDirectoryReadmeContents(
                    "name",
                    currentContents,
                    "markdownForTree",
                    endOfLine
                )
            ).toThrow(
                "Invalid file structure: only one description marker found or end marker found before start marker"
            );
        });
    });
});
