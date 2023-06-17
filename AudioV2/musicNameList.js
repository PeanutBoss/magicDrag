export const musicNameList = ['ADVENTURE_PARTY.mp3','Next World.mp3','像你这样的大师.mp3','再飞行.mp3','别看我小.mp3','十二生肖闯江湖.mp3','小鲤鱼历险记.mp3','开心往前飞.mp3','春风不解意.mp3','果宝特攻.mp3','横冲直撞.mp3','流星.mp3','相信爱.mp3','绿色的旋律.mp3','黑 - TV Verison.mp3']

export function getMusicList () {
  const musicList = []
  musicNameList.forEach(musicName => {
    musicList.push({ name: musicName, url: `../Audio/assets/music/${musicName}`, image: '../Audio/assets/suolong.png' })
  })
  return musicList
}

export function getMusicName(index) {
  let musicName;
  if (index || index === 0) {
    musicName = musicNameList[index];
    console.log(`开始播放：${musicName.split('.')[0]}`);
    return musicName;
  }
  const randomIndex = Math.ceil(Math.random() * musicNameList.length) - 1;
  musicName = musicNameList[randomIndex];
  console.log(`开始播放：${musicName.split('.')[0]}`);
  return musicName;
}
