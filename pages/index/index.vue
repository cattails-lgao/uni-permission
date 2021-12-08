<template>
	<view class="content">
		<button type="default" @tap="openContarct">打开通讯录</button>
	</view>
</template>

<script>
	import nativeContract from '@/common/nativeContract.js';
	export default {
		methods: {
			openContarct() {
				// #ifdef APP-PLUS
				nativeContract.open(contact => {
					console.log(contact);
				});
				// #endif
			}
		}
	}
</script>

<style>
	
</style>
