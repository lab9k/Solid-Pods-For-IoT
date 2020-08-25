import SolidAuth from 'solid-auth-client';
import auth from 'solid-auth-client';
import FC from 'solid-file-client';
var fc = new FC(auth);

export async function getFiles() {
    return new Promise((resolve, reject) => {
        SolidAuth.trackSession((session) => {
            if (!!session) {
                var url = `https://${session.webId.split('/')[2]}/private/iot`;
                fc.readFolder(url)
                    .then((res) => {
                        var files = res.files.map((file) => file.url);
                        resolve(files);
                    })
                    .catch((err) => {
                        reject(err)
                    });
            } else {
                reject('Not logged in?!');
            }
        });
    })
    
}