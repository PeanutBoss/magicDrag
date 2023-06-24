const fs = require('fs')
const path = require('path')

const getNameMethodStr = 'export function getMusicName(index) {\n' +
  '  let musicName;\n' +
  '  if (index || index === 0) {\n' +
  '    musicName = musicNameList[index];\n' +
  '    console.log(`开始播放：${musicName.split(\'.\')[0]}`);\n' +
  '    return musicName;\n' +
  '  }\n' +
  '  const randomIndex = Math.ceil(Math.random() * musicNameList.length) - 1;\n' +
  '  musicName = musicNameList[randomIndex];\n' +
  '  console.log(`开始播放：${musicName.split(\'.\')[0]}`);\n' +
  '  return musicName;\n' +
  '}'

const getMusicListStr = 'export function getMusicList () {\n' +
  '  const musicList = []\n' +
  '  musicNameList.forEach(musicName => {\n' +
  '    musicList.push({ name: musicName, url: `./assets/music/${musicName}`, image: \'./assets/image/suolong.png\' })\n' +
  '  })\n' +
  '  return musicList\n' +
  '}'

function insertExport (str) {
  str.forEach((_, index) => {
    str[index] = `'${str[index]}'`
  })
  return 'export const musicNameList = [' + str + ']' + '\n' + getNameMethodStr + '\n' + getMusicListStr
}

fs.readdir(path.resolve(__dirname, './assets/music'), (err, data) => {
  if (err) console.log(err)
  const insertContent = insertExport(data)
  const buffer = Buffer.alloc(Buffer.byteLength(insertContent), insertContent)
  fs.writeFile(path.resolve(__dirname, 'musicNameList.js'), buffer, (err, data) => {
    if (!err) {
      console.log('同步成功！')
    }
  })
})
