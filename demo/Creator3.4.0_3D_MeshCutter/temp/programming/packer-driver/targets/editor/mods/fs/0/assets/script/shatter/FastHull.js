System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, Vec2, Vec3, Vec4, Color, primitives, math, gfx, FastHull, _crd, tempVec3;

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function readAttribute(data, constructor) {
    const out = [];
    let size = 0;

    switch (constructor) {
      case Vec3:
        size = 3;
        break;

      case Vec2:
        size = 2;
        break;

      case Vec4:
      case Color:
        size = 4;
        break;

      default:
        console.warn('unexpect type');
        break;
      // return
    }

    for (let i = 0; i < Math.ceil(data.length / size); i++) {
      let start = i * size;
      let end = start + size;
      out.push(new constructor(...data.slice(start, end)));
    }

    return out;
  }

  function writeAttribute(data) {
    const out = [];

    if (data[0] instanceof Vec3) {
      for (let i = 0, l = data.length; i < l; i++) {
        out.push(data[i].x, data[i].y, data[i].z);
      }
    } else if (data[0] instanceof Vec2) {
      for (let i = 0, l = data.length; i < l; i++) {
        out.push(data[i].x, data[i].y);
      }
    } else if (data[0] instanceof Vec4) {
      for (let i = 0, l = data.length; i < l; i++) {
        out.push(data[i].x, data[i].y, data[i].z, data[i].w);
      }
    } else if (data[0] instanceof Color) {
      for (let i = 0, l = data.length; i < l; i++) {
        out.push(data[i].x, data[i].y, data[i].z, data[i].w);
      }
    }

    return out;
  }

  _export("FastHull", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      Vec2 = _cc.Vec2;
      Vec3 = _cc.Vec3;
      Vec4 = _cc.Vec4;
      Color = _cc.Color;
      primitives = _cc.primitives;
      math = _cc.math;
      gfx = _cc.gfx;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "16b90EdeGJLGayO2RO2TxzC", "FastHull", undefined);

      tempVec3 = new Vec3(0, 0, 0);

      _export("FastHull", FastHull = class FastHull {
        constructor(mesh) {
          _defineProperty(this, "isValid", true);

          _defineProperty(this, "vertices", void 0);

          _defineProperty(this, "normals", new Array());

          _defineProperty(this, "colors", new Array());

          _defineProperty(this, "tangents", new Array());

          _defineProperty(this, "uvs", new Array());

          _defineProperty(this, "indices", new Array());

          _defineProperty(this, "center", new Vec3());

          _defineProperty(this, "size", new Vec3());

          _defineProperty(this, "minPos", new Vec3());

          _defineProperty(this, "maxPos", new Vec3());

          if (mesh instanceof FastHull) {
            this.vertices = [];
            this.indices = [];

            if (mesh.normals && mesh.normals.length > 0) {
              this.normals = [];
            }

            if (mesh.colors && mesh.colors.length > 0) {
              this.colors = [];
            }

            if (mesh.tangents && mesh.tangents.length > 0) {
              this.tangents = [];
            }

            if (mesh.uvs && mesh.uvs.length > 0) {
              this.uvs = [];
            }
          } else {
            mesh = mesh;
            this.vertices = readAttribute(mesh.positions, Vec3);
            this.indices = mesh.indices;

            if (mesh.normals && mesh.normals.length > 0) {
              this.normals = readAttribute(mesh.normals, Vec3);
            }

            if (mesh.uvs && mesh.uvs.length > 0) {
              this.uvs = readAttribute(mesh.uvs, Vec2);
            }

            if (mesh.colors && mesh.colors.length > 0) {
              this.colors = readAttribute(mesh.colors, Color);
            }

            if (mesh.tangents && mesh.tangents.length > 0) {
              this.tangents = readAttribute(mesh.tangents, Vec4);
            }

            if (mesh.minPos && mesh.maxPos) {
              this.center = Vec3.add(new Vec3(), mesh.minPos, mesh.maxPos).multiplyScalar(1 / 2);
              this.size = Vec3.subtract(new Vec3(), mesh.maxPos, mesh.minPos);
            } // console.log(this)

          }
        }

        get IsEmpty() {
          return !this.isValid || this.vertices.length < 3 || this.indices.length < 3;
        }

        GetMesh(hull) {
          if (this.isValid) {
            let mesh = {
              positions: []
            };
            mesh.positions = writeAttribute(hull.vertices);
            mesh.indices = hull.indices;
            mesh.customAttributes = [];

            if (hull.normals) {
              mesh.normals = writeAttribute(hull.normals);
            }

            if (hull.colors) {
              mesh.normals = writeAttribute(hull.colors);
            }

            if (hull.tangents) {
              mesh.customAttributes.push({
                attr: new gfx.Attribute(gfx.AttributeName.ATTR_TANGENT, gfx.Format.RGB32F),
                values: writeAttribute(hull.tangents)
              });
              mesh.tangents = writeAttribute(hull.tangents);
            }

            if (hull.uvs) {
              mesh.uvs = writeAttribute(hull.uvs);
            }

            return mesh;
          }

          return primitives.box({
            width: 1,
            height: 1,
            length: 1
          });
        }

        Split(localPointOnPlane, localPlaneNormal, fillCut) {
          if (localPlaneNormal.equals(Vec3.ZERO)) {
            localPlaneNormal.set(Vec3.UP);
          }

          let a = new FastHull(this);
          let b = new FastHull(this);
          let vertexAbovePlane = [];
          let oldToNewVertexMap = [];
          this.AssignVertices(a, b, localPointOnPlane, localPlaneNormal, vertexAbovePlane, oldToNewVertexMap);
          let cutEdges = [];
          let cutColors = [];
          this.AssignTriangles(a, b, vertexAbovePlane, oldToNewVertexMap, localPointOnPlane, localPlaneNormal, cutEdges, cutColors);

          if (fillCut) {
            // this.FillCutEdges(a, b, cutEdges, localPlaneNormal, uvMapper);
            if (!this.FastFillCutEdges(a, b, cutEdges, localPointOnPlane, localPlaneNormal, cutColors)) {
              return [];
            }
          }

          this.ValidateOutput(a, b, localPlaneNormal); // Set output

          return [this.GetMesh(a), this.GetMesh(b)];
        }

        AssignVertices(a, b, pointOnPlane, planeNormal, vertexAbovePlane, oldToNewVertexMap) {
          for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i];
            let abovePlane = Vec3.subtract(tempVec3, vertex, pointOnPlane).dot(planeNormal) >= 0;
            vertexAbovePlane[i] = abovePlane;

            if (abovePlane) {
              // Assign vertex to hull A
              oldToNewVertexMap[i] = a.vertices.length;
              a.vertices.push(vertex);

              if (this.normals) {
                a.normals.push(this.normals[i]);
              }

              if (this.colors) {
                a.colors.push(this.colors[i]);
              }

              if (this.tangents) {
                a.tangents.push(this.tangents[i]);
              }

              if (this.uvs) {
                a.uvs.push(this.uvs[i]);
              }
            } else {
              // Assign vertex to hull B
              oldToNewVertexMap[i] = b.vertices.length;
              b.vertices.push(vertex);

              if (this.normals) {
                b.normals.push(this.normals[i]);
              }

              if (this.colors) {
                b.colors.push(this.colors[i]);
              }

              if (this.tangents) {
                b.tangents.push(this.tangents[i]);
              }

              if (this.uvs) {
                b.uvs.push(this.uvs[i]);
              }
            }
          }
        }

        AssignTriangles(a, b, vertexAbovePlane, oldToNewVertexMap, pointOnPlane, planeNormal, cutEdges, cutColors) {
          let triangleCount = this.indices.length / 3;

          for (let i = 0; i < triangleCount; i++) {
            let index0 = this.indices[i * 3 + 0];
            let index1 = this.indices[i * 3 + 1];
            let index2 = this.indices[i * 3 + 2];
            let above0 = vertexAbovePlane[index0];
            let above1 = vertexAbovePlane[index1];
            let above2 = vertexAbovePlane[index2];

            if (above0 && above1 && above2) {
              // Assign triangle to hull A
              a.indices.push(oldToNewVertexMap[index0]);
              a.indices.push(oldToNewVertexMap[index1]);
              a.indices.push(oldToNewVertexMap[index2]);
            } else if (!above0 && !above1 && !above2) {
              // Assign triangle to hull B
              b.indices.push(oldToNewVertexMap[index0]);
              b.indices.push(oldToNewVertexMap[index1]);
              b.indices.push(oldToNewVertexMap[index2]);
            } else {
              // Split triangle
              let top;
              let cw;
              let ccw;

              if (above1 == above2 && above0 != above1) {
                top = index0;
                cw = index1;
                ccw = index2;
              } else if (above2 == above0 && above1 != above2) {
                top = index1;
                cw = index2;
                ccw = index0;
              } else {
                top = index2;
                cw = index0;
                ccw = index1;
              }

              let cutVertex0 = new Vec3();
              let cutVertex1 = new Vec3();
              let cutColor0 = new Color();
              let cutColor1 = new Color();

              if (vertexAbovePlane[top]) {
                this.SplitTriangle(a, b, oldToNewVertexMap, pointOnPlane, planeNormal, top, cw, ccw, cutVertex0, cutVertex1, cutColor0, cutColor1);
              } else {
                this.SplitTriangle(b, a, oldToNewVertexMap, pointOnPlane, planeNormal, top, cw, ccw, cutVertex1, cutVertex0, cutColor1, cutColor0);
              } // Add cut edge


              if (!cutVertex0.equals(cutVertex1)) {
                cutEdges.push(cutVertex0);
                cutEdges.push(cutVertex1);

                if (this.colors) {
                  cutColors === null || cutColors === void 0 ? void 0 : cutColors.push(cutColor0);
                  cutColors === null || cutColors === void 0 ? void 0 : cutColors.push(cutColor1);
                }
              }
            }
          }
        }

        SplitTriangle(topHull, bottomHull, oldToNewVertexMap, pointOnPlane, planeNormal, top, cw, ccw, cwIntersection, ccwIntersection, cwColorIntersection, ccwColorIntersection) {
          let v0 = this.vertices[top];
          let v1 = this.vertices[cw];
          let v2 = this.vertices[ccw]; // Intersect the top-cw edge with the plane

          let cwDenominator = Vec3.subtract(tempVec3, v1, v0).dot(planeNormal);
          let cwScalar = math.clamp01(Vec3.subtract(tempVec3, pointOnPlane, v0).dot(planeNormal) / cwDenominator); // Intersect the top-ccw edge with the plane

          let ccwDenominator = Vec3.subtract(tempVec3, v2, v0).dot(planeNormal);
          let ccwScalar = math.clamp01(Vec3.subtract(tempVec3, pointOnPlane, v0).dot(planeNormal) / ccwDenominator); // Interpolate vertex positions

          let cwVertex = new Vec3();
          cwVertex.x = v0.x + (v1.x - v0.x) * cwScalar;
          cwVertex.y = v0.y + (v1.y - v0.y) * cwScalar;
          cwVertex.z = v0.z + (v1.z - v0.z) * cwScalar;
          let ccwVertex = new Vec3();
          ccwVertex.x = v0.x + (v2.x - v0.x) * ccwScalar;
          ccwVertex.y = v0.y + (v2.y - v0.y) * ccwScalar;
          ccwVertex.z = v0.z + (v2.z - v0.z) * ccwScalar; // Create top triangle

          let cwA = topHull.vertices.length;
          topHull.vertices.push(cwVertex);
          let ccwA = topHull.vertices.length;
          topHull.vertices.push(ccwVertex);
          topHull.indices.push(oldToNewVertexMap[top]);
          topHull.indices.push(cwA);
          topHull.indices.push(ccwA); // Create bottom triangles

          let cwB = bottomHull.vertices.length;
          bottomHull.vertices.push(cwVertex);
          let ccwB = bottomHull.vertices.length;
          bottomHull.vertices.push(ccwVertex);
          bottomHull.indices.push(oldToNewVertexMap[cw]);
          bottomHull.indices.push(oldToNewVertexMap[ccw]);
          bottomHull.indices.push(ccwB);
          bottomHull.indices.push(oldToNewVertexMap[cw]);
          bottomHull.indices.push(ccwB);
          bottomHull.indices.push(cwB); // Interpolate normals

          if (this.normals && this.colors.length >= 3) {
            let n0 = this.normals[top];
            let n1 = this.normals[cw];
            let n2 = this.normals[ccw];
            let cwNormal = new Vec3();
            cwNormal.x = n0.x + (n1.x - n0.x) * cwScalar;
            cwNormal.y = n0.y + (n1.y - n0.y) * cwScalar;
            cwNormal.z = n0.z + (n1.z - n0.z) * cwScalar;
            cwNormal.normalize();
            let ccwNormal = new Vec3();
            ccwNormal.x = n0.x + (n2.x - n0.x) * ccwScalar;
            ccwNormal.y = n0.y + (n2.y - n0.y) * ccwScalar;
            ccwNormal.z = n0.z + (n2.z - n0.z) * ccwScalar;
            ccwNormal.normalize(); // Add vertex property

            topHull.normals.push(cwNormal);
            topHull.normals.push(ccwNormal);
            bottomHull.normals.push(cwNormal);
            bottomHull.normals.push(ccwNormal);
          } // Interpolate colors


          if (this.colors && this.colors.length >= 3) {
            let c0 = this.colors[top];
            let c1 = this.colors[cw];
            let c2 = this.colors[ccw];
            let cwColor = Color.lerp(new Color(), c0, c1, cwScalar);
            let ccwColor = Color.lerp(new Color(), c0, c2, ccwScalar); // Add vertex property

            topHull.colors.push(cwColor);
            topHull.colors.push(ccwColor);
            bottomHull.colors.push(cwColor);
            bottomHull.colors.push(ccwColor);
            cwColorIntersection === null || cwColorIntersection === void 0 ? void 0 : cwColorIntersection.set(cwColor);
            ccwColorIntersection === null || ccwColorIntersection === void 0 ? void 0 : ccwColorIntersection.set(ccwColor);
          } // Interpolate tangents


          if (this.tangents && this.tangents.length >= 3) {
            let t0 = this.tangents[top];
            let t1 = this.tangents[cw];
            let t2 = this.tangents[ccw];
            let cwTangent = new Vec4();
            cwTangent.x = t0.x + (t1.x - t0.x) * cwScalar;
            cwTangent.y = t0.y + (t1.y - t0.y) * cwScalar;
            cwTangent.z = t0.z + (t1.z - t0.z) * cwScalar;
            cwTangent.normalize();
            cwTangent.w = t1.w;
            let ccwTangent = new Vec4();
            ccwTangent.x = t0.x + (t2.x - t0.x) * ccwScalar;
            ccwTangent.y = t0.y + (t2.y - t0.y) * ccwScalar;
            ccwTangent.z = t0.z + (t2.z - t0.z) * ccwScalar;
            ccwTangent.normalize();
            ccwTangent.w = t2.w; // Add vertex property

            topHull.tangents.push(cwTangent);
            topHull.tangents.push(ccwTangent);
            bottomHull.tangents.push(cwTangent);
            bottomHull.tangents.push(ccwTangent);
          } // Interpolate uvs


          if (this.uvs) {
            let u0 = this.uvs[top];
            let u1 = this.uvs[cw];
            let u2 = this.uvs[ccw];
            let cwUv = new Vec2();
            cwUv.x = u0.x + (u1.x - u0.x) * cwScalar;
            cwUv.y = u0.y + (u1.y - u0.y) * cwScalar;
            let ccwUv = new Vec2();
            ccwUv.x = u0.x + (u2.x - u0.x) * ccwScalar;
            ccwUv.y = u0.y + (u2.y - u0.y) * ccwScalar; // Add vertex property

            topHull.uvs.push(cwUv);
            topHull.uvs.push(ccwUv);
            bottomHull.uvs.push(cwUv);
            bottomHull.uvs.push(ccwUv);
          } // Set output


          cwIntersection.set(cwVertex);
          ccwIntersection.set(ccwVertex);
        }

        FastFillCutEdges(a, b, edges, pos, normal, colors) {
          if (edges.length < 3) {
            console.log("edges point less 3! cut fail");
            return false;
          }

          for (let i = 0; i < edges.length - 3; i++) {
            let t = edges[i + 1];
            let temp = edges[i + 3];

            for (let j = i + 2; j < edges.length - 1; j += 2) {
              if (Vec3.subtract(tempVec3, edges[j], t).lengthSqr() < 1e-6) {
                edges[j] = edges[i + 2];
                edges[i + 3] = edges[j + 1];
                edges[j + 1] = temp;
                break;
              }

              if (Vec3.subtract(tempVec3, edges[j + 1], t).lengthSqr() < 1e-6) {
                edges[j + 1] = edges[i + 2];
                edges[i + 3] = edges[j];
                edges[j] = temp;
                break;
              }
            }

            edges.splice(i + 2, 1);
            if (this.colors) colors === null || colors === void 0 ? void 0 : colors.splice(i + 2, 1);
          }

          edges.splice(edges.length - 1, 1);
          if (this.colors) colors === null || colors === void 0 ? void 0 : colors.splice(edges.length - 1, 1);
          let offsetA = a.vertices.length;
          let offsetB = b.vertices.length;
          a.vertices.push(...edges);
          b.vertices.push(...edges);

          if (this.colors) {
            a.colors.push(...colors);
            b.colors.push(...colors);
          }

          if (this.normals) {
            let normalA = Vec3.negate(new Vec3(), normal);
            let normalB = normal;
            let tangentA = this.CalculateTangent(normalA);
            let tangentB = this.CalculateTangent(normalB);

            for (let i = 0; i < edges.length; i++) {
              a.normals.push(normalA);
              b.normals.push(normalB);
            }

            if (this.tangents) {
              for (let i = 0; i < edges.length; i++) {
                a.tangents.push(tangentA);
                b.tangents.push(tangentB);
              }
            }
          }

          let indicesA = [];
          let indicesB = [];

          for (let i = 1, count = edges.length - 1; i < count; i++) {
            indicesA.push(offsetA + 0);
            indicesA.push(offsetA + i + 1);
            indicesA.push(offsetA + i);
            indicesB.push(offsetB + 0);
            indicesB.push(offsetB + i);
            indicesB.push(offsetB + i + 1);
          }

          a.indices.push(...indicesA);
          b.indices.push(...indicesB);

          if (this.uvs) {
            let uvsa = this.uvMap(indicesA, edges, offsetA);
            a.uvs.push(...uvsa);
            let uvsb = this.uvMap(indicesB, edges, offsetB);
            b.uvs.push(...uvsb);
          } // return cutEdges;


          return true;
        }

        CalculateTangent(normal) {
          let tan = Vec3.cross(tempVec3, normal, Vec3.UP);
          if (tan == Vec3.ZERO) tan = Vec3.cross(tempVec3, normal, Vec3.FORWARD);
          tan = Vec3.cross(tempVec3, tan, normal);
          return new Vec4(tan.x, tan.y, tan.z, 1);
        }

        uvMap(indices, vertices, offset) {
          // console.log(indices);
          // console.log(vertices);
          // console.log(offset);
          let uvs = [];
          let count = indices.length / 3;
          let uvRangeMin = new Vec2(0, 0);
          let uvRangeMax = new Vec2(1, 1);

          for (let i = 0; i < count; i++) {
            let _i0 = indices[i * 3] - offset;

            let _i1 = indices[i * 3 + 1] - offset;

            let _i2 = indices[i * 3 + 2] - offset;

            let v0 = Vec3.subtract(tempVec3, vertices[_i0], this.center).add(this.size).multiplyScalar(1 / 2);
            v0 = Vec3.divide(new Vec3(), v0, this.size);
            let v1 = Vec3.subtract(tempVec3, vertices[_i1], this.center).add(this.size).multiplyScalar(1 / 2);
            v1 = Vec3.divide(new Vec3(), v1, this.size);
            let v2 = Vec3.subtract(tempVec3, vertices[_i2], this.center).add(this.size).multiplyScalar(1 / 2);
            v2 = Vec3.divide(new Vec3(), v2, this.size);
            let a = Vec3.subtract(new Vec3(), v0, v1);
            let b = Vec3.subtract(new Vec3(), v2, v1);
            let dir = Vec3.cross(new Vec3(), a, b);
            let x = Math.abs(Vec3.dot(dir, Vec3.RIGHT));
            let y = Math.abs(Vec3.dot(dir, Vec3.UP));
            let z = Math.abs(Vec3.dot(dir, Vec3.FORWARD));

            if (x >= y && x >= z) {
              uvs[_i0] = new Vec2(v0.z, v0.y);
              uvs[_i1] = new Vec2(v1.z, v1.y);
              uvs[_i2] = new Vec2(v2.z, v2.y);
            } else if (y >= x && y >= z) {
              uvs[_i0] = new Vec2(v0.x, v0.z);
              uvs[_i1] = new Vec2(v1.x, v1.z);
              uvs[_i2] = new Vec2(v2.x, v2.z);
            } else if (z >= x && z >= y) {
              uvs[_i0] = new Vec2(v0.x, v0.y);
              uvs[_i1] = new Vec2(v1.x, v1.y);
              uvs[_i2] = new Vec2(v2.x, v2.y);
            }

            uvs[_i0] = new Vec2(uvRangeMin.x + (uvRangeMax.x - uvRangeMin.x) * uvs[_i0].x, uvRangeMin.y + (uvRangeMax.y - uvRangeMin.y) * uvs[_i0].y);
            uvs[_i1] = new Vec2(uvRangeMin.x + (uvRangeMax.x - uvRangeMin.x) * uvs[_i1].x, uvRangeMin.y + (uvRangeMax.y - uvRangeMin.y) * uvs[_i1].y);
            uvs[_i2] = new Vec2(uvRangeMin.x + (uvRangeMax.x - uvRangeMin.x) * uvs[_i2].x, uvRangeMin.y + (uvRangeMax.y - uvRangeMin.y) * uvs[_i2].y);
          }

          return uvs;
        }

        ValidateOutput(a, b, planeNormal) {
          let lengthA = a.LengthAlongAxis(planeNormal);
          let lengthB = b.LengthAlongAxis(planeNormal);
          let sum = lengthA + lengthB;

          if (sum < FastHull.smallestValidLength) {
            a.isValid = false;
            b.isValid = false;
          } else if (lengthA / sum < FastHull.smallestValidRatio) {
            a.isValid = false;
          } else if (lengthB / sum < FastHull.smallestValidRatio) {
            b.isValid = false;
          }
        }

        LengthAlongAxis(axis) {
          if (this.vertices.length > 0) {
            let min = this.vertices[0].dot(axis);
            let max = min;
            this.vertices.forEach(vertex => {
              let distance = vertex.dot(axis);
              min = Math.min(distance, min);
              max = Math.max(distance, max);
            });
            return max - min;
          }

          return 0;
        }

      });

      _defineProperty(FastHull, "smallestValidLength", 0.01);

      _defineProperty(FastHull, "smallestValidRatio", 0.05);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=FastHull.js.map