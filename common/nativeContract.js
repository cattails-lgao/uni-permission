import iosPermission from './ios-permission.js';

/**
 * andriod校验权限
 * @param {array}  ArrPermissions 
 */
const androidPermission = (ArrPermissions) => {
	const Build = plus.android.importClass("android.os.Build");
	const Manifest = plus.android.importClass("android.Manifest");
	const MainActivity = plus.android.runtimeMainActivity();
	//var context=main.getApplicationContext(); //未用到,在此仅供参考  

	function PermissionCheck(permission) {
		if (Build.VERSION.SDK_INT >= 23) {
			if (MainActivity.checkSelfPermission(permission) == -1) {
				return false;
			}
		}
		return true;
	}

	function PermissionChecks(Arr) {
		let HasPermission = true;
		for (let index in Arr) {
			const permission = Arr[index];
			//如果此处没有权限,则是用户拒绝了  
			if (!PermissionCheck(permission)) {
				HasPermission = false;
				break;
			}
		}
		return HasPermission;
	}

	function PermissionRequest(Arr) {
		const REQUEST_CODE_CONTACT = 101;
		if (Build.VERSION.SDK_INT >= 23) {
			MainActivity.requestPermissions(Arr, REQUEST_CODE_CONTACT);
		}
	}

	//如果没有权限，则申请  
	if (!PermissionChecks(ArrPermissions)) {
		PermissionRequest(ArrPermissions);
	} else { //如果拥有权限，那么干点啥吧^_^  
		return true;
	}
	
	return false;
}

export default {
	isAndroid() {
		return plus.os.name === 'Android';
	},
	isIOS() {
		return plus.os.name === 'iOS';
	},
	open(callback, beforeCallback, afterCallback) {
		let beforeCallbackCopy = () => {
			uni.showLoading({
				title: '加载中'
			});
		};
		let afterCallbackCopy = () => {
			uni.hideLoading();
		};
		if (typeof beforeCallback === 'function')
			beforeCallbackCopy = beforeCallback;
		if (typeof afterCallback === 'function')
			afterCallbackCopy = afterCallback;
			
		if(!this.checkPermission()) {
			console.error('未获得通讯录权限');
			return;
		}

		if (this.isAndroid())
			this.android.open(callback, beforeCallbackCopy, afterCallbackCopy)
		if (this.isIOS())
			this.ios.open(callback, beforeCallbackCopy, afterCallbackCopy)
	},
	checkPermission() {
		if (this.isAndroid()) return androidPermission(['android.permission.CONTACTS']);
		
		if (this.isIOS()) return iosPermission.CNContactStore();
	},
	ios: {
		open(callback, beforeCallback, afterCallback) {
			if (typeof beforeCallback === 'function') beforeCallback.call(null);
			
			const contactPickerVC = plus.ios.newObject("CNContactPickerViewController");
			const delegate = plus.ios.implements("CNContactPickerDelegate", {
				"contactPicker:didSelectContact:": (picker, contact) => {
					console.log(JSON.stringify(picker));
					console.log(JSON.stringify(contact));
					//姓名/公司
					let name = "";
					//姓氏
					const familyName = contact.plusGetAttribute("familyName");
					//名字
					const givenName = contact.plusGetAttribute("givenName");
					//公司
					const organizationName = contact.plusGetAttribute("organizationName");
					name = familyName + givenName;
					if (name.length <= 0) {
						name = organizationName;
					}
					//电话号码
					let phoneNo = "";
					const phoneNumbers = contact.plusGetAttribute("phoneNumbers");
					if (phoneNumbers.plusGetAttribute("count") > 0) {
					    const phone = phoneNumbers.plusGetAttribute("firstObject");
					    const phoneNumber = phone.plusGetAttribute("value");
					    phoneNo = phoneNumber.plusGetAttribute("stringValue");
					}
					if(callBack){
					    callBack.call(null, { name, phone: phoneNo });
					}
				}
			})
			
			//给通讯录控制器contactPickerVC设置代理
			plus.ios.invoke(contactPickerVC, "setDelegate:", delegate);
			//获取跟控制器
			var rootVc = nativeCommon.contacts.ios.getRootViewController();
			//由跟控制器present到通讯录控制器
			plus.ios.invoke(
				rootVc, 
				"presentViewController:animated:completion:", 
				contactPickerVC, 
				true, 
				() => {
					if (typeof afterCallback === 'function') afterCallback.call(null);
				}
			);
		}
	},
	android: {
		open(callback, beforeCallback, afterCallback) {
			if (typeof beforeCallback === 'function') beforeCallback.call(null);

			const REQUESTCODE = 1000;
			const main = plus.android.runtimeMainActivity();
			const IntentPakage = plus.android.importClass('android.content.Intent');
			const ContactsContractPakge = plus.android.importClass('android.provider.ContactsContract');
			const Intent = new IntentPakage(IntentPakage.ACTION_PICK, ContactsContractPakge.Contacts.CONTENT_URI);

			main.onActivityResult = (requestCode, resultCode, data) => {
				if (REQUESTCODE == requestCode) {
					let phoneNumber = null;
					let resultString = "";
					const context = main;
					plus.android.importClass(data);
					const contactData = data.getData();

					const resolver = context.getContentResolver();
					plus.android.importClass(resolver);

					const cursor = resolver.query(contactData, null, null, null, null);
					plus.android.importClass(cursor);
					cursor.moveToFirst();

					const givenName = cursor.getString(cursor.getColumnIndex(ContactsContractPakge.Contacts
						.DISPLAY_NAME));
					const contactId = cursor.getString(cursor.getColumnIndex(ContactsContractPakge.Contacts._ID));
					const pCursor = resolver.query(
						ContactsContractPakge.CommonDataKinds.Phone.CONTENT_URI,
						null,
						ContactsContractPakge.CommonDataKinds.Phone.CONTACT_ID + " = " + contactId,
						null,
						null
					);
					if (pCursor.moveToNext()) {
						phoneNumber = pCursor.getString(pCursor.getColumnIndex(ContactsContractPakge.CommonDataKinds
							.Phone.NUMBER));
					}

					if (typeof callback === 'function')
						callback.call(null, {
							name: givenName,
							phone: phoneNumber
						});

					cursor.close();
					pCursor.close();
				}
			}

			main.startActivityForResult(Intent, REQUESTCODE);

			if (typeof afterCallback === 'function') afterCallback.call(null);
		}
	}
}
