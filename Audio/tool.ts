const musicNameList = [
	'ADVENTURE_PARTY.mp3',
	'像你这样的大师.mp3',
	'十二生肖闯江湖.mp3',
	'春风不解意.mp3',
	'果宝特攻.mp3',
	'横冲直撞.mp3',
	'绿色的旋律.mp3'
]

export function getMusicName () {
	const randomIndex = Math.ceil(Math.random() * 7) - 1
	const musicName = musicNameList[randomIndex]
	console.log(`开始播放：${musicName.split('.')[0]}`)
	return musicName
}
