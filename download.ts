import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/checker1016-85/saju-character-engine/main/saju_db.xlsx';
const dest = 'saju_db.xlsx';

const file = fs.createWriteStream(dest);

https.get(url, (response) => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ 파일 다운로드 완료: ' + dest);
    });
  } else {
    console.error('❌ 다운로드 실패! 상태 코드: ' + response.statusCode);
  }
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error('❌ 에러 발생: ' + err.message);
});
