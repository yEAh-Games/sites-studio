function saveWorkspaceToGithub() {
    var saveButton = document.getElementById("saveButton");
    var originalValue = saveButton.value;
    var loadingAnimation = "...";
    saveButton.value = loadingAnimation;

    var xml = Blockly.Xml.workspaceToDom(workspace);
    var xml_text = Blockly.Xml.domToText(xml);

    var repoOwner = "yeah-games";
    var repoName = "sites";
    var commitMessage = "Save ySite workspace for: " + siteValue;

    var content = {
        message: commitMessage,
        content: btoa(xml_text),
    };

    var validatedUserData = validateUserDataFromCookie();
    if (!validatedUserData) {
        console.log('User is not logged in. Save operation aborted.');
        return;
    }

    var validatedUsername = validatedUserData.username;
    var filePath = "data/editor/saves/" + siteValue + "_index.html.yg";

    var existingFile;

    var permissionCheck = fetch("https://sites.yeahgames.net/data/sites.json")
        .then(response => response.json())
        .then(sitesData => {
            var userSites = sitesData.find(data => data[validatedUsername]);
            if (userSites && userSites[validatedUsername].s.includes(siteValue)) {
                var deleteAndCreateSaveFile = fetch("https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contents/" + filePath, {
                    headers: {
                        "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40)
                    }
                })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else if (response.status === 404) {
                            return Promise.resolve(null);
                        } else {
                            throw new Error("Failed to check file existence: " + response.status);
                        }
                    })
                    .then(file => {
                        existingFile = file;
                        if (existingFile) {
                            return fetch(existingFile.url, {
                                method: "DELETE",
                                headers: {
                                    "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40),
                                    "Accept": "application/vnd.github.v3+json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    message: "Delete old save file for:  " + siteValue,
                                    sha: existingFile.sha,
                                })
                            }).then(response => {
                                if (!response.ok) {
                                    throw new Error("Failed to delete existing save: " + response.status);
                                }
                                return new Promise(resolve => setTimeout(resolve, 3000));
                            });
                        }
                        return Promise.resolve();
                    })
                    .then(() => {
                        return fetch("https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contents/" + filePath, {
                            method: "PUT",
                            headers: {
                                "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40),
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(content)
                        });
                    });

                var getIndexFile = fetch("https://api.github.com/repos/ysites" + "/" + siteValue + "/contents" + "/index.html", {
                    headers: {
                        "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40)
                    }
                })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else if (response.status === 404) {
                            return Promise.resolve(null);
                        } else {
                            throw new Error("Failed to check file existence: " + response.status);
                        }
                    })
                    .then(file => {
                        existingFile = file;
                        if (existingFile) {
                            return fetch(existingFile.url, {
                                method: "DELETE",
                                headers: {
                                    "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40),
                                    "Accept": "application/vnd.github.v3+json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    message: "Delete old index.html for:  " + siteValue,
                                    sha: existingFile.sha,
                                })
                            }).then(response => {
                                if (!response.ok) {
                                    throw new Error("Failed to delete existing index.html: " + response.status);
                                }
                                return new Promise(resolve => setTimeout(resolve, 3000));
                            });
                        }
                        return Promise.resolve();
                    })
                    .then(() => {
                        return fetch("https://api.github.com/repos/ysites" + "/" + siteValue + "/contents" + "/index.html", {
                            method: "PUT",
                            headers: {
                                "Authorization": "Bearer " + authorizeFromAPIServer.slice(0, 40),
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: "Save index.html for: " + siteValue,
                                content: btoa(document.getElementById("sourcecode").innerText),
                            })
                        });
                    });

                Promise.all([deleteAndCreateSaveFile, getIndexFile])
                    .then(() => {
                        console.log("Save operations completed successfully");
                        saveButton.value = "Save complete!";
                        setTimeout(function () {
                            saveButton.value = originalValue;
                        }, 2000);
                    })
                    .catch(error => {
                        console.error("Error during save operations:", error);
                    });

                return Promise.resolve();
            } else {
                console.log("@" + validatedUsername + " does not have permission to edit the project: " + siteValue);
                document.documentElement.innerHTML = `
            <title>403 Forbidden</title>
            <style>
              html, body {
                padding: 0;
                margin: 0;
                height: 100%;
              }
              .forbidden-overlay {
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                border: none;
                height: 100%;
                width: 100%;
              }
            </style>
            <iframe src="https://www.yeahgames.net/errors/http/403" class="forbidden-overlay"></iframe>
          `;
                return Promise.reject();
            }
        });

    permissionCheck.catch(error => {
        console.error("Error during permission check:", error);
        document.documentElement.innerHTML = `
      <title>403 Forbidden</title>
        <style>
          html, body {
            padding: 0;
            margin: 0;
            height: 100%;
          }
          .forbidden-overlay {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            border: none;
            height: 100%;
            width: 100%;
          }
        </style>
        <iframe src="https://www.yeahgames.net/errors/http/403" class="forbidden-overlay"></iframe>
      `;
    });
}

document.getElementById("saveButton").onclick = saveWorkspaceToGithub;
