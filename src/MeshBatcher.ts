/** @format */

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import SkeletonMeshMaterial from "./SkeletonMeshMaterial";

export default class MeshBatcher extends Mesh {
	depth = 0;

	private static VERTEX_SIZE = 9;
	private verticesLength = 0;
	private indicesLength = 0;

	private maxVerticesLength = 0;
	private maxIndicesLength = 0;

	// private _positions:number[]; // Mesh has this already.
	private _nPositions: number[];
	private _indices: number[];

	// private vertices: Float32Array;
	// private indices: Uint16Array;

	private _colors: number[];
	private _uvs: number[];

	constructor(name: string, scene: Scene, maxVertices = 10920) {
		super(name, scene);
		if (maxVertices > 10920)
			throw new Error(
				"Can't have more than 10920 triangles per batch: " + maxVertices,
			);

		this.layerMask = 1;
		this.maxVerticesLength =
			maxVertices * MeshBatcher.VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;
		this.maxIndicesLength = maxVertices * 3 * Uint16Array.BYTES_PER_ELEMENT;

		this.material = new SkeletonMeshMaterial("shader_" + name, scene);

		this._nPositions = [];
		this._indices = [];
		this._colors = [];
		this._uvs = [];

		this.actionManager = new ActionManager(scene);
	}

	get is(): string {
		return "MeshBatcher";
	}

	clear() {
		this._nPositions = [];
		this._indices = [];
		this._colors = [];
		this._uvs = [];
	}

	begin() {
		this.verticesLength = 0;
		this.indicesLength = 0;
	}

	canBatch(verticesLength: number, indicesLength: number) {
		const indicesLengthLow =
			this.indicesLength + indicesLength >= this.maxIndicesLength / 2;
		const verticesLengthLow =
			this.verticesLength + verticesLength >= this.maxVerticesLength / 2;

		return !(indicesLengthLow || verticesLengthLow);

		// if (this.indicesLength + indicesLength >= this.maxIndicesLength / 2)
		//   return false;
		// if (this.verticesLength + verticesLength >= this.maxVerticesLength / 2)
		//   return false;
		// return true;
	}

	// run by parts
	batch(
		vertices: ArrayLike<number>,
		verticesLength: number,
		indices: ArrayLike<number>,
		indicesLength: number,
		z = 0,
	) {
		// ZOffset 0.1 to 1 for alphaIndex and set margin
		this.alphaIndex = Math.abs(z) * 10 + this.depth * 1000;

		const indexStart = this.verticesLength / MeshBatcher.VERTEX_SIZE;
		let j = 0;
		for (; j < verticesLength; ) {
			this._nPositions.push(vertices[j++]);
			this._nPositions.push(vertices[j++]);
			this._nPositions.push(z);

			this._colors.push(vertices[j++]);
			this._colors.push(vertices[j++]);
			this._colors.push(vertices[j++]);
			this._colors.push(vertices[j++]);

			this._uvs.push(vertices[j++]);
			this._uvs.push(vertices[j++]);
		}
		this.verticesLength += (verticesLength / 8) * 9;
		for (j = 0; j < indicesLength; j++)
			this._indices.push(indices[j] + indexStart);

		this.indicesLength += indicesLength;
	}

	end() {
		const vertexData = new VertexData();

		vertexData.indices = this._indices;
		vertexData.positions = this._nPositions;
		vertexData.colors = this._colors;
		vertexData.uvs = this._uvs;

		vertexData.applyToMesh(this, true);

		this._nPositions = [];
		this._indices = [];
		this._colors = [];
		this._uvs = [];

		// vertexData = null;
	}
}
