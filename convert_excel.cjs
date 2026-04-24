const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

// 설정 부분 (사용자가 업로드할 엑셀 파일명)
const EXCEL_FILES = [
  path.join(__dirname, '사주명리_완전정리_DB.xlsx'),
  path.join(__dirname, 'saju_db.xlsx')
];
const JSON_FILE = path.join(__dirname, 'src', 'lib', 'saju_db.json');

function convertExcelToJson() {
  const EXCEL_FILE = EXCEL_FILES.find(f => fs.existsSync(f));

  if (!EXCEL_FILE) {
    console.error(`❌ 에러: 엑셀 파일을 찾을 수 없습니다.`);
    console.error(`'사주명리_완전정리_DB.xlsx' 또는 'saju_db.xlsx' 파일을 업로드해주세요!`);
    return;
  }

  try {
    console.log(`✅ 엑셀 파일 읽는 중: ${EXCEL_FILE}`);
    const workbook = xlsx.readFile(EXCEL_FILE);
    const result = {};

    // 각 시트를 JSON으로 변환
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      // 엑셀 시트 데이터를 JSON 배열로 변환
      const data = xlsx.utils.sheet_to_json(sheet);
      result[sheetName] = data;
      console.log(` - '${sheetName}' 시트 변환 완료 (${data.length}개 항목)`);
    });

    // 여기서 필요한 데이터 구조 변환을 수행할 수 있습니다.
    // 일단은 통째로 JSON 파일로 저장합니다.
    fs.writeFileSync(JSON_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`🎉 성공: JSON 데이터가 ${JSON_FILE}에 저장되었습니다.`);
  } catch (error) {
    console.error('❌ 변환 중 오류가 발생했습니다:', error);
  }
}

convertExcelToJson();
