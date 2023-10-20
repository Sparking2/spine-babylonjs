/** @format */

import { Effect } from "@babylonjs/core";
import {
	IShaderMaterialOptions,
	ShaderMaterial,
} from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";

Effect.ShadersStore.spineVertexShader = `
     precision highp float;
     
     attribute vec3 position;
     attribute vec2 uv;
     attribute vec4 color;
       
     uniform mat4 worldViewProjection; 
     
     varying vec2 vUv;
       
     void main() {
        vec4 p = vec4(position,1.);
        gl_Position = worldViewProjection * p;
        vUv = uv;
     }
`;

Effect.ShadersStore.spineFragmentShader = `
    precision highp float;

    varying vec2 vUv;
    uniform sampler2D textureSampler;

    void main(void) {
        vec4 color = texture2D(textureSampler, vUv);
        gl_FragColor = vec4(color.x, color.y, color.z, 1.);
        
        gl_FragColor.a = color.w;
    }
`;

export default class SkeletonMeshMaterial extends ShaderMaterial {
	constructor(name: string, scene: Scene) {
		const options: Partial<IShaderMaterialOptions> = {
			needAlphaBlending: true,
			needAlphaTesting: true,
			attributes: ["position", "uv"],
			uniforms: ["worldViewProjection", "map"],
		};
		super(name, scene, "spine", options);

		this.backFaceCulling = false;
		this.alpha = 0.1;
	}
}
