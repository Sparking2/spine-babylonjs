/** @format */

import { Texture as BabylonTexture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import {
	BlendMode,
	Texture,
	TextureFilter,
	TextureWrap,
} from "@esotericsoftware/spine-core";

export default class BabylonJsTexture extends Texture {
	texture: BabylonTexture;

	constructor(image: HTMLImageElement | ImageBitmap, scene: Scene) {
		super(image);

		const invertY = false;
		if (image instanceof HTMLImageElement)
			this.texture = new BabylonTexture(image.src, scene, false, invertY);
		else
			this.texture = new BabylonTexture(
				null,
				scene,
				false,
				invertY,
				1,
				null,
				null,
				image,
			);
		this.texture.hasAlpha = true;
		this.texture.getAlphaFromRGB = true;
	}

	static toBabylonJsTextureFilter(filter: TextureFilter) {
		switch (filter) {
			case TextureFilter.Linear:
				return BabylonTexture.LINEAR_LINEAR;
			case TextureFilter.MipMap:
				return BabylonTexture.LINEAR_LINEAR_MIPLINEAR;
			case TextureFilter.MipMapLinearNearest:
				return BabylonTexture.LINEAR_LINEAR;
			case TextureFilter.MipMapNearestLinear:
				return BabylonTexture.NEAREST_LINEAR_MIPNEAREST;
			case TextureFilter.MipMapNearestNearest:
				return BabylonTexture.NEAREST_NEAREST_MIPNEAREST;
			case TextureFilter.Nearest:
				return BabylonTexture.NEAREST_NEAREST;
			default:
				throw new Error(`Unknown texture filter`);
		}
	}

	static toBabylonJsTextureWrap(wrap: TextureWrap) {
		switch (wrap) {
			case TextureWrap.ClampToEdge:
				return BabylonTexture.CLAMP_ADDRESSMODE;
			case TextureWrap.MirroredRepeat:
				return BabylonTexture.MIRROR_ADDRESSMODE;
			case TextureWrap.Repeat:
				return BabylonTexture.WRAP_ADDRESSMODE;
			default:
				throw new Error(`Unknown texture wrap`);
		}
	}

	static toBabylonJsBlending(blend: BlendMode) {
		switch (blend) {
			default:
				throw new Error(`Unknown blendMode: ${blend}`);
		}
	}

	setFilters(minFilter: TextureFilter, magFilter: TextureFilter): void {
		this.texture.updateSamplingMode(
			BabylonJsTexture.toBabylonJsTextureFilter(minFilter),
		);
		this.texture.updateSamplingMode(
			BabylonJsTexture.toBabylonJsTextureFilter(magFilter),
		);
	}

	setWraps(uWrap: TextureWrap, vWrap: TextureWrap): void {
		this.texture.wrapU = BabylonJsTexture.toBabylonJsTextureWrap(uWrap);
		this.texture.wrapV = BabylonJsTexture.toBabylonJsTextureWrap(vWrap);
	}

	dispose(): void {
		this.texture.dispose();
	}
}
