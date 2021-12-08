export default {
	CNContactStore() { // 通讯录
		const CNContactStore = plus.ios.import("CNContactStore");
		const cnAuthStatus = CNContactStore.authorizationStatusForEntityType(0);
		console.log("CNContactStore:" + authStatus);
		plus.ios.deleteObject(CNContactStore);
		
		return cnAuthStatus == 3
	},
	PHPhotoLibrary() {
		const PHPhotoLibrary = plus.ios.import("PHPhotoLibrary");  
		const authStatus = PHPhotoLibrary.authorizationStatus();  
		console.log("PHPhotoLibrary:" + authStatus);  

		plus.ios.deleteObject(PHPhotoLibrary);
		
		return authStatus == 3;
	}
}
