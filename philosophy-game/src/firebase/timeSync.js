import { ref, onValue } from 'firebase/database';
import { database } from './config';

let serverTimeOffset = 0;

// Lắng nghe độ lệch thời gian (offset) giữa client và server Firebase
const offsetRef = ref(database, '.info/serverTimeOffset');
onValue(offsetRef, (snapshot) => {
  serverTimeOffset = snapshot.val() || 0;
});

/**
 * Trả về thời gian hiện tại của server Firebase (ước tính)
 * Bằng cách lấy giờ local cộng với độ lệch offset.
 * Cách này giúp đồng bộ thời gian giữa tất cả các client.
 */
export const getServerTime = () => {
  return Date.now() + serverTimeOffset;
};
