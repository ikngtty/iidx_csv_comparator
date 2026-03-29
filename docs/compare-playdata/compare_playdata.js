import { checkIidxCsv, compareChart, parseIidxCsv } from "../shared/iidx.js";

const inputsCsv = [1, 2].map((i) => document.getElementById(`inputCsv${i}`));
const buttonCompare = document.getElementById("buttonCompare");
const tableComparison = document.getElementById("tableComparison");

{
  inputsCsv.forEach((inputCsv, i) => {
    const savedValue = localStorage.getItem(`iidxComparator.csv${i + 1}`);
    if (savedValue != null) {
      inputCsv.value = savedValue;
    }
  });
}

inputsCsv.forEach((inputCsv, i) => {
  inputCsv.addEventListener("input", () => {
    localStorage.setItem(`iidxComparator.csv${i + 1}`, inputCsv.value);
  });
});

buttonCompare.addEventListener("click", () => {
  const tbody = tableComparison.tBodies[0];

  // テーブルのリセット
  tbody.replaceChildren();

  // バリデーションチェック
  // TODO: ValidatableFieldの使用
  inputsCsv.forEach((inputCsv, i) => {
    const checkedResult = checkIidxCsv(inputCsv.value);
    if (!checkedResult.isValid) {
      alert(`Player${i + 1}のCSV読み込み中にエラーが発生しました。`);
      throw new Error(
        `invalid csv${i + 1} at line ${checkedResult.line}: ${checkedResult.error}`,
      );
    }
  });

  const [records1, records2] = inputsCsv.map((inputCsv) =>
    parseIidxCsv(inputCsv.value),
  );

  const comparisons = makeRecordComparisons(compareChart, records1, records2);
  for (const comparison of comparisons) {
    addComparisonRow(tbody, comparison);
  }
});

function addComparisonRow(tbody, comparison) {
  const row = tbody.insertRow();
  row.insertCell().textContent = comparison.chart.song.version;
  row.insertCell().textContent = comparison.chart.song.title;
  row.insertCell().textContent = comparison.chart.difficulty;
  row.insertCell().textContent = comparison.chart.level;
  row.insertCell().textContent = comparison.result1?.clearType;
  row.insertCell().textContent = comparison.result2?.clearType;
  row.insertCell().textContent = comparison.result1?.missCount;
  row.insertCell().textContent = comparison.result2?.missCount;
  row.insertCell().textContent = comparison.result1?.djLevel;
  row.insertCell().textContent = comparison.result2?.djLevel;
  row.insertCell().textContent = comparison.result1?.score;
  row.insertCell().textContent = comparison.result2?.score;
}

function* makeRecordComparisons(compareChart, records1, records2) {
  // ソート
  const [sortedRecords1, sortedRecords2] = [records1, records2].map((records) =>
    [...records].sort((left, right) => compareChart(left.chart, right.chart)),
  );

  // 記録を比較しようとして双方の曲が違った時に、どちらを先に処理するか判断するための比較関数
  const compare = (record1, record2) => {
    // nullが常に大きい
    if (record1 == null) {
      return 1;
    } else if (record2 == null) {
      return -1;
    }

    return compareChart(record1.chart, record2.chart);
  };

  // 片方に無い曲を補完しながら比較を生成
  let [i1, i2] = [0, 0];
  while (i1 < sortedRecords1.length || i2 < sortedRecords2.length) {
    const [record1, record2] = [sortedRecords1[i1], sortedRecords2[i2]];

    const delta = compare(record1, record2);
    switch (true) {
      case delta < 0:
        yield makeRecordComparison(record1.chart, record1.result, null);
        i1++;
        break;
      case delta > 0:
        yield makeRecordComparison(record2.chart, null, record2.result);
        i2++;
        break;
      default:
        yield makeRecordComparison(
          record1.chart,
          record1.result,
          record2.result,
        );
        i1++;
        i2++;
        break;
    }
  }
}

function makeRecordComparison(chart, result1, result2) {
  return {
    chart,
    result1,
    result2,
  };
}
