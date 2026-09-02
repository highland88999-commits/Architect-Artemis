import math
import sympy as sp
import numpy as np

class MathEngine:
    """
    Artemis Core Mathematics Engine.
    Provides comprehensive capabilities across algebra, calculus, linear algebra, and advanced spatial geometry.
    """
    
    def execute(self, category: str, operation: str, params: dict):
        if category == "algebra":
            return self._algebra(operation, params)
        elif category == "calculus":
            return self._calculus(operation, params)
        elif category == "geometry":
            return self._geometry(operation, params)
        elif category == "linear_algebra":
            return self._linear_algebra(operation, params)
        else:
            raise ValueError(f"Unknown math category: {category}")

    def _geometry(self, op: str, params: dict):
        """
        Advanced Spatial & Computational Geometry Engine.
        Utilizes SciPy for N-dimensional spatial logic and SymPy for exact symbolic proofs.
        """
        if op == "convex_hull":
            from scipy.spatial import ConvexHull
            points = np.array(params.get('points'))
            if len(points) < 3:
                raise ValueError("Convex Hull requires at least 3 points.")
            hull = ConvexHull(points)
            return {
                "vertices": points[hull.vertices].tolist(),
                "area": float(hull.area),
                "volume": float(hull.volume)
            }
            
        elif op == "delaunay_tessellation":
            from scipy.spatial import Delaunay
            points = np.array(params.get('points'))
            tri = Delaunay(points)
            return {"simplices": tri.simplices.tolist()}
            
        elif op == "voronoi_diagram":
            from scipy.spatial import Voronoi
            points = np.array(params.get('points'))
            vor = Voronoi(points)
            return {
                "vertices": vor.vertices.tolist(),
                "regions": [region for region in vor.regions if -1 not in region and len(region) > 0]
            }

        elif op == "symbolic_distance":
            # Exact fractional distance between N-dimensional coordinates
            p1 = sp.Point(*params.get('p1', [0,0]))
            p2 = sp.Point(*params.get('p2', [0,0]))
            return str(p1.distance(p2))

        elif op == "polygon_properties":
            # Symbolic analysis of a generic polygon
            points = [sp.Point(*pt) for pt in params.get('points')]
            poly = sp.Polygon(*points)
            return {
                "area": str(poly.area),
                "perimeter": str(poly.perimeter),
                "is_convex": bool(poly.is_convex())
            }

        elif op == "circle_area":
            r = params.get('radius', 0)
            return math.pi * (r ** 2)
            
        elif op == "sphere_volume":
            r = params.get('radius', 0)
            return (4/3) * math.pi * (r ** 3)
            
        else:
            raise ValueError(f"Unknown geometry operation: {op}")

    def _algebra(self, op: str, params: dict):
        expr = sp.sympify(params.get('expression'))
        if op == "simplify":
            return str(sp.simplify(expr))
        elif op == "expand":
            return str(sp.expand(expr))
        elif op == "solve":
            var = sp.Symbol(params.get('variable', 'x'))
            solutions = sp.solve(expr, var)
            return [str(sol) for sol in solutions]
        else:
            raise ValueError(f"Unknown algebra operation: {op}")

    def _calculus(self, op: str, params: dict):
        expr = sp.sympify(params.get('expression'))
        var = sp.Symbol(params.get('variable', 'x'))
        if op == "derivative":
            return str(sp.diff(expr, var))
        elif op == "integral":
            return str(sp.integrate(expr, var))
        elif op == "definite_integral":
            a = sp.sympify(params.get('lower_bound'))
            b = sp.sympify(params.get('upper_bound'))
            return str(sp.integrate(expr, (var, a, b)))
        elif op == "limit":
            val = sp.sympify(params.get('approach_value', 0))
            return str(sp.limit(expr, var, val))
        elif op == "taylor_series":
            point = params.get('point', 0)
            degree = params.get('degree', 5)
            return str(sp.series(expr, var, point, degree).removeO())
        else:
            raise ValueError(f"Unknown calculus operation: {op}")

    def _linear_algebra(self, op: str, params: dict):
        matrix_data = params.get('matrix')
        if not matrix_data:
            raise ValueError("Matrix data required.")
        mat = np.array(matrix_data)
        if op == "determinant":
            return float(np.linalg.det(mat))
        elif op == "inverse":
            return np.linalg.inv(mat).tolist()
        elif op == "eigenvalues":
            eigenvals, _ = np.linalg.eig(mat)
            return [str(val) for val in eigenvals]
        elif op == "transpose":
            return mat.T.tolist()
        else:
            raise ValueError(f"Unknown linear algebra operation: {op}")
