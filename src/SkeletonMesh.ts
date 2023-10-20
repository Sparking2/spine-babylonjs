/** @format */

import {
	AnimationState,
	AnimationStateData,
	ClippingAttachment,
	Color,
	MeshAttachment,
	NumberArrayLike,
	RegionAttachment,
	Skeleton,
	SkeletonClipping,
	SkeletonData,
	Utils,
	Vector2,
} from "@esotericsoftware/spine-core";
import { IShaderMaterialOptions } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import MeshBatcher from "./MeshBatcher";
import BabylonJsTexture from "./BabylonJsTexture";
import SkeletonMeshMaterial from "./SkeletonMeshMaterial";

export type SkeletonMeshMaterialParametersCustomizer = (
	materialParameters: IShaderMaterialOptions,
) => void;

export default class SkeletonMesh extends Mesh {
	static QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
	static VERTEX_SIZE = 2 + 2 + 4;
	tempPos: Vector2 = new Vector2();
	tempUv: Vector2 = new Vector2();
	tempLight = new Color();
	tempDark = new Color();
	spineSkeleton: Skeleton;
	spineState: AnimationState;
	zOffset = 0.1;
	scene: Scene;
	private batches = new Array<MeshBatcher>();
	private nextBatchIndex = 0;
	private clipper: SkeletonClipping = new SkeletonClipping();
	private vertices = Utils.newFloatArray(1024);
	private tempColor = new Color();

	constructor(
		name: string,
		scene: Scene,
		skeletonData: SkeletonData,
		// private materialCustomerizer: SkeletonMeshMaterialParametersCustomizer = (
		//   material,
		// ) => {},
	) {
		super(name, scene);

		this.spineSkeleton = new Skeleton(skeletonData);
		const animData = new AnimationStateData(skeletonData);
		this.spineState = new AnimationState(animData);
		this.billboardMode = Mesh.BILLBOARDMODE_ALL;

		this.scene = scene;
	}

	update(deltaTime: number) {
		const state = this.spineState;
		const skeleton = this.spineSkeleton;

		state.update(deltaTime);
		state.apply(skeleton);
		skeleton.updateWorldTransform();

		this.updateGeometry();
	}
	dispose() {
		for (let i = 0; i < this.batches.length; i++) {
			this.batches[i].dispose();
		}
	}
	private clearBatches() {
		for (let i = 0; i < this.batches.length; i++) {
			this.batches[i].clear();
			this.batches[i].isVisible = false;
		}
		this.nextBatchIndex = 0;
	}
	private nextBatch() {
		if (this.batches.length == this.nextBatchIndex) {
			const batch = new MeshBatcher("batcher", this.scene, 10920);
			this.addChild(batch);
			this.batches.push(batch);
		}
		const batch = this.batches[this.nextBatchIndex++];
		batch.isVisible = true;
		return batch;
	}
	private updateGeometry() {
		this.clearBatches();

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// const tempPos = this.tempPos;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// const tempUv = this.tempUv;
		const tempLight = this.tempLight;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// const tempDark = this.tempDark;
		const clipper = this.clipper;

		let vertices: NumberArrayLike = this.vertices;
		let triangles: number[] | null = null;
		let uvs: NumberArrayLike | null = null;
		const drawOrder = this.spineSkeleton.drawOrder;
		let batch = this.nextBatch();
		batch.begin();
		let z = 0;
		const zOffset = this.zOffset;

		for (let i = 0, n = drawOrder.length; i < n; i++) {
			const vertexSize = clipper.isClipping() ? 2 : SkeletonMesh.VERTEX_SIZE;
			const slot = drawOrder[i];
			if (!slot.bone.active) {
				clipper.clipEndWithSlot(slot);
				continue;
			}
			const attachment = slot.getAttachment();
			let attachmentColor: Color | null;
			let texture: BabylonJsTexture | null;
			let numFloats = 0;

			if (attachment instanceof RegionAttachment) {
				const region = attachment;
				attachmentColor = region.color;
				numFloats = vertexSize * 4;

				// Perform calculations to set vertices, triangles, and uvs based on BabylonJS equivalents.
				region.computeWorldVertices(slot, vertices, 0, vertexSize);
				triangles = SkeletonMesh.QUAD_TRIANGLES;
				uvs = region.uvs;

				texture = region.region!.texture as BabylonJsTexture;
			} else if (attachment instanceof MeshAttachment) {
				const mesh = attachment;
				attachmentColor = mesh.color;
				vertices = this.vertices;
				numFloats = (mesh.worldVerticesLength >> 1) * vertexSize;
				if (numFloats > vertices.length) {
					vertices = this.vertices = Utils.newFloatArray(numFloats);
				}
				mesh.computeWorldVertices(
					slot,
					0,
					mesh.worldVerticesLength,
					vertices,
					0,
					vertexSize,
				);
				triangles = mesh.triangles;
				uvs = mesh.uvs;
				texture = mesh.region!.texture as BabylonJsTexture;
			} else if (attachment instanceof ClippingAttachment) {
				clipper.clipStart(slot, attachment);
				continue;
			} else {
				clipper.clipEndWithSlot(slot);
				continue;
			}

			if (texture != null) {
				const skeleton = slot.bone.skeleton;
				const skeletonColor = skeleton.color;
				const slotColor = slot.color;
				const alpha = skeletonColor.a * slotColor.a * attachmentColor.a;
				const color = this.tempColor;
				color.set(
					skeletonColor.r * slotColor.r * attachmentColor.r,
					skeletonColor.g * slotColor.g * attachmentColor.g,
					skeletonColor.b * slotColor.b * attachmentColor.b,
					alpha,
				);

				let finalVertices: NumberArrayLike;
				let finalVerticesLength: number;
				let finalIndices: NumberArrayLike;
				let finalIndicesLength: number;

				if (clipper.isClipping()) {
					clipper.clipTriangles(
						vertices,
						numFloats,
						triangles,
						triangles.length,
						uvs,
						color,
						tempLight,
						false,
					);
					const clippedVertices = clipper.clippedVertices;
					const clippedTriangles = clipper.clippedTriangles;
					finalVertices = clippedVertices;
					finalVerticesLength = clippedVertices.length;
					finalIndices = clippedTriangles;
					finalIndicesLength = clippedTriangles.length;
				} else {
					const verts = vertices;
					for (
						let v = 2, u = 0, n = numFloats;
						v < n;
						v += vertexSize, u += 2
					) {
						verts[v] = color.r;
						verts[v + 1] = color.g;
						verts[v + 2] = color.b;
						verts[v + 3] = color.a;
						verts[v + 4] = uvs[u];
						verts[v + 5] = uvs[u + 1];
					}
					finalVertices = vertices;
					finalVerticesLength = numFloats;
					finalIndices = triangles;
					finalIndicesLength = triangles.length;
				}

				if (finalVerticesLength == 0 || finalIndicesLength == 0) {
					clipper.clipEndWithSlot(slot);
					continue;
				}

				// Start new batch if this one can't hold vertices/indices
				if (
					!batch.canBatch(
						finalVerticesLength / SkeletonMesh.VERTEX_SIZE,
						finalIndicesLength,
					)
				) {
					batch.end();
					batch = this.nextBatch();
					batch.begin();
				}
				let batchMaterial = batch.material as SkeletonMeshMaterial;
				if (batchMaterial.getActiveTextures().length == 0) {
					batchMaterial.setTexture("textureSampler", texture.texture);
				}
				if (!batchMaterial.hasTexture(texture.texture)) {
					batch.end();
					batch = this.nextBatch();
					batch.begin();
					batchMaterial = batch.material as SkeletonMeshMaterial;
					batchMaterial.setTexture("textureSampler", texture.texture);
				}

				batch.batch(
					finalVertices,
					finalVerticesLength,
					finalIndices,
					finalIndicesLength,
					z,
				);
				z += zOffset;
			}

			clipper.clipEndWithSlot(slot);
		}

		clipper.clipEnd();
		batch.end();
	}
}
