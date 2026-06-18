import math
import sympy as sp
import numpy as np

class MathEngine:
    """
    Artemis Core Mathematics Engine.
    Provides comprehensive capabilities across multiple mathematical domains.
    """
    
    def execute(self, category: str, operation: str, params: dict):
        """Routes the calculation to the correct mathematical domain."""
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

    def _algebra(self, op: str, params: dict):
        expr = sp.sympify(params.get('expression'))
        
        if op == "simplify":
            return str(sp.simplify(expr))
        elif op == "expand":
            return str(sp.expand(expr))
        elif op == "solve":
            # Solves expression == 0 for a given variable
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

    def _geometry(self, op: str, params: dict):
        if op == "circle_area":
            r = params.get('radius', 0)
            return math.pi * (r ** 2)
        elif op == "sphere_volume":
            r = params.get('radius', 0)
            return (4/3) * math.pi * (r ** 3)
        elif op == "hypotenuse":
            return math.hypot(params.get('a', 0), params.get('b', 0))
        elif op == "distance_2d":
            p1, p2 = params.get('p1', [0,0]), params.get('p2', [0,0])
            return math.dist(p1, p2)
        elif op == "pythagorean_theorem":
            # Returns hypotenuse c given a and b
            a, b = params.get('a', 0), params.get('b', 0)
            return math.sqrt(a**2 + b**2)
        else:
            raise ValueError(f"Unknown geometry operation: {op}")

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
            # Convert complex numbers to strings for JSON safety
            return [str(val) for val in eigenvals]
        elif op == "transpose":
            return mat.T.tolist()
        else:
            raise ValueError(f"Unknown linear algebra operation: {op}")


