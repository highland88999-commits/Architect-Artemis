import numpy as np
import math

class PhysicsEngine:
    """
    Artemis Core Physics Engine.
    Provides mathematical grounding in universal laws.
    """
    def __init__(self):
        # Universal Constants
        self.c = 299792458      # Speed of light in vacuum (m/s)
        self.G = 6.67430e-11    # Newtonian constant of gravitation (m^3/kg/s^2)
        self.h = 6.62607015e-34 # Planck constant (J*s)
        self.k_B = 1.380649e-23 # Boltzmann constant (J/K)

    def mass_energy_equivalence(self, mass_kg: float) -> float:
        """E = mc^2. Returns energy in Joules."""
        return mass_kg * (self.c ** 2)

    def gravitational_force(self, m1: float, m2: float, radius: float) -> float:
        """Newton's law of universal gravitation. Returns force in Newtons."""
        if radius <= 0:
            raise ValueError("Distance (radius) must be greater than zero.")
        return self.G * (m1 * m2) / (radius ** 2)

    def escape_velocity(self, mass: float, radius: float) -> float:
        """Calculates the velocity required to escape a massive body. Returns m/s."""
        if radius <= 0:
            raise ValueError("Radius must be greater than zero.")
        return np.sqrt(2 * self.G * mass / radius)

    def time_dilation(self, velocity: float, time_interval: float) -> float:
        """Special Relativity: Calculates dilated time based on velocity."""
        if velocity >= self.c:
            raise ValueError("Velocity cannot meet or exceed the speed of light.")
        lorentz_factor = 1 / math.sqrt(1 - (velocity ** 2 / self.c ** 2))
        return time_interval * lorentz_factor

