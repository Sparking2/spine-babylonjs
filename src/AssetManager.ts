/** @format */

import { AssetManagerBase, Downloader } from "@esotericsoftware/spine-core";
import BabylonJsTexture from "./BabylonJsTexture";
import { Scene } from "@babylonjs/core/scene";

export default class AssetManager extends AssetManagerBase {
	constructor(
		scene: Scene,
		pathPrefix = "",
		downloader: Downloader = new Downloader(),
	) {
		super(
			(image: HTMLImageElement | ImageBitmap) => {
				return new BabylonJsTexture(image, scene);
			},
			pathPrefix,
			downloader,
		);
	}
}
