export function firestoreTimestampToString(timestamp) {
  if (timestamp == null) return "---";

  return timestamp.toDate().toLocaleString();
}
