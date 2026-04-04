import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  collection,
  getDocFromServer,
  getDocsFromServer,
  getFirestore,
  limit,
  orderBy,
  startAt,
  query,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import { CONFIG as FIREBASE_CONFIG } from "../shared/firebase_util.js";
import { getPlaydataDocRef } from "../shared/repository.js";
import { firestoreTimestampToString } from "../shared/util.js";

const USER_PROFILE_COUNT_PER_PAGE = 10;

const buttonSearch = document.getElementById("buttonSearch");
const tableUsers = document.getElementById("tableUsers");
const buttonSearchNext = document.getElementById("buttonSearchNext");

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

let lastSearch = {
  query: null,
  nextDoc: null,
};

buttonSearch.addEventListener("click", async () => {
  // テーブルのリセット
  const tbody = tableUsers.tBodies[0];
  tbody.replaceChildren();

  const searchQuery = query(
    collection(db, "userProfiles"),
    orderBy("createdAt", "desc"),
    limit(USER_PROFILE_COUNT_PER_PAGE + 1),
  );

  const userProfilesSnapshot = await getDocsFromServer(searchQuery);

  lastSearch.query = searchQuery;
  if (userProfilesSnapshot.size > USER_PROFILE_COUNT_PER_PAGE) {
    lastSearch.nextDoc = userProfilesSnapshot.docs[USER_PROFILE_COUNT_PER_PAGE];
  } else {
    lastSearch.nextDoc = null;
  }
  renderForLastSearch(lastSearch);

  userProfilesSnapshot.docs
    .slice(0, USER_PROFILE_COUNT_PER_PAGE)
    .forEach((userProfileDoc) => {
      addUserRow(tbody, userProfileDoc.id, userProfileDoc.data());
    });
});

buttonSearchNext.addEventListener("click", async () => {
  const searchQuery = query(lastSearch.query, startAt(lastSearch.nextDoc));
  const userProfilesSnapshot = await getDocsFromServer(searchQuery);

  if (userProfilesSnapshot.size > USER_PROFILE_COUNT_PER_PAGE) {
    lastSearch.nextDoc = userProfilesSnapshot.docs[USER_PROFILE_COUNT_PER_PAGE];
  } else {
    lastSearch.nextDoc = null;
  }
  renderForLastSearch(lastSearch);

  const tbody = tableUsers.tBodies[0];
  userProfilesSnapshot.docs
    .slice(0, USER_PROFILE_COUNT_PER_PAGE)
    .forEach((userProfileDoc) => {
      addUserRow(tbody, userProfileDoc.id, userProfileDoc.data());
    });
});

async function handleButtonCompareClick(event) {
  const { userId, playside, playerIndex } = event.currentTarget.dataset;

  const playdataDocRef = getPlaydataDocRef(db, userId, playside);
  const playdataDoc = await getDocFromServer(playdataDocRef);
  const playdata = playdataDoc.data()?.data;

  localStorage.setItem(`iidxComparator.csv${playerIndex}`, playdata);
  location.href = "../compare-playdata/";
}

function renderForLastSearch(lastSearch) {
  buttonSearchNext.disabled = lastSearch.nextDoc == null;
}

function addUserRow(tbody, userId, userProfile) {
  const row = tbody.insertRow();
  row.insertCell().textContent = userProfile.userName;
  row.insertCell().textContent = userProfile.djName;
  row.insertCell().textContent = userProfile.iidxId;

  const uploadedAtCell = row.insertCell();
  uploadedAtCell.appendChild(
    document.createTextNode(
      firestoreTimestampToString(userProfile.playdataSpUploadedAt),
    ),
  );
  uploadedAtCell.appendChild(document.createElement("br"));
  uploadedAtCell.appendChild(
    document.createTextNode(
      firestoreTimestampToString(userProfile.playdataDpUploadedAt),
    ),
  );

  const buttonsToCompareCell = row.insertCell();
  [
    ["sp", "SP", userProfile.playdataSpUploadedAt],
    ["dp", "DP", userProfile.playdataDpUploadedAt],
  ].forEach(([playside, playsideLabel, uploadedAt]) => {
    [1, 2].forEach((playerIndex) => {
      const button = document.createElement("button");
      button.textContent = `${playsideLabel}のデータをPlayer${playerIndex}にセット`;
      if (uploadedAt == null) {
        button.disabled = true;
      } else {
        button.dataset.userId = userId;
        button.dataset.playside = playside;
        button.dataset.playerIndex = playerIndex;
        button.addEventListener("click", handleButtonCompareClick);
      }
      buttonsToCompareCell.appendChild(button);
    });
    buttonsToCompareCell.appendChild(document.createElement("br"));
  });
}
