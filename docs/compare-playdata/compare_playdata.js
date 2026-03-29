const VERSION_NAMES = [
  "1st&substream",
  "2nd style",
  "3rd style",
  "4th style",
  "5th style",
  "6th style",
  "7th style",
  "8th style",
  "9th style",
  "10th style",
  "IIDX RED",
  "HAPPY SKY",
  "DistorteD",
  "GOLD",
  "DJ TROOPERS",
  "EMPRESS",
  "SIRIUS",
  "Resort Anthem",
  "Lincle",
  "tricoro",
  "SPADA",
  "PENDUAL",
  "copula",
  "SINOBUZ",
  "CANNON BALLERS",
  "Rootage",
  "HEROIC VERSE",
  "BISTROVER",
  "CastHour",
  "RESIDENT",
  "EPOLIS",
  "Pinky Crush",
  "Sparkle Shower",
];

const VERSION_NUMBER_FOR_NAME = (() => {
  const m = new Map();
  VERSION_NAMES.forEach((name, i) => {
    m.set(name, i + 1);
  });
  return m;
})();

const SONG_TITLE_COLLATOR = new Intl.Collator("ja");

const DIFFICULTIES = ["BEGINNER", "NORMAL", "HYPER", "ANOTHER", "LEGGENDARIA"];

const DIFFICUTY_ORDER = (() => {
  const m = new Map();
  DIFFICULTIES.forEach((dif, i) => {
    m.set(dif, i);
  });
  return m;
})();

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

function compareChart(chart1, chart2) {
  const songDelta = compareSong(chart1.song, chart2.song);
  if (songDelta !== 0) {
    return songDelta;
  }

  const [difOrder1, difOrder2] = [chart1, chart2].map((chart) => {
    const dif = chart.difficulty;
    const order = DIFFICUTY_ORDER.get(dif);
    if (order == null) {
      throw new Error(`unexpected difficulty: ${dif}`);
    }
    return order;
  });

  return difOrder1 - difOrder2;
}

function compareSong(song1, song2) {
  const [ver1, ver2] = [song1, song2].map((song) => {
    const name = song.version;
    const num = VERSION_NUMBER_FOR_NAME.get(name);
    if (num == null) {
      throw new Error(`unexpected version name: ${name}`);
    }
    return num;
  });

  const verDelta = ver1 - ver2;
  if (verDelta !== 0) {
    return verDelta;
  }

  return SONG_TITLE_COLLATOR.compare(song1.title, song2.title);
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

function* parseIidxCsv(text) {
  for (const row of parseCsv(text)) {
    const song = {
      version: row["バージョン"],
      title: row["タイトル"],
    };

    for (const difficulty of DIFFICULTIES) {
      const level = row[`${difficulty} 難易度`];
      if (level === "0") {
        continue;
      }

      const chart = {
        song,
        difficulty,
        level,
      };

      const result = {
        clearType: row[`${difficulty} クリアタイプ`],
        missCount: row[`${difficulty} ミスカウント`],
        djLevel: row[`${difficulty} DJ LEVEL`],
        score: row[`${difficulty} スコア`],
      };

      yield { chart, result };
    }
  }
}

function* parseCsv(text) {
  const lines = readLines(text);

  const { done, value: header } = lines.next();
  if (done) {
    throw new Error("No header");
  }
  const headerNames = header.split(",");

  for (const line of lines) {
    if (line === "") {
      continue;
    }

    const items = line.split(",");
    if (items.length !== headerNames.length) {
      throw new Error("Different column count");
    }

    yield Object.fromEntries(headerNames.map((h, i) => [h, items[i]]));
  }
}

function* readLines(text) {
  let start = 0;
  let end;
  while ((end = text.indexOf("\n", start)) !== -1) {
    yield text.slice(start, end);
    start = end + 1;
  }
  if (start < text.length) {
    yield text.slice(start);
  }
}
