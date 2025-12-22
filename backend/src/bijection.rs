//! Bijection engine using multiplicative inverse modular arithmetic

use num_bigint::{BigUint, BigInt};
use num_traits::{Zero, One, ToPrimitive, Signed};
use num_integer::Integer;

use crate::constants::CLUSTERS_PER_PAGE;

/// Bijective mapping between content and addresses
pub struct BijectionEngine {
    alphabet_size: BigUint,
    modulus: BigUint,
    multiplier: BigUint,
    inverse: BigUint,
}

impl BijectionEngine {
    pub fn new(alphabet_size: usize) -> Self {
        let alphabet_size = BigUint::from(alphabet_size);
        let modulus = alphabet_size.pow(CLUSTERS_PER_PAGE as u32);

        let multiplier = Self::generate_coprime(&modulus);
        let inverse = Self::mod_inverse(&multiplier, &modulus)
            .expect("Failed to compute modular inverse");

        BijectionEngine { alphabet_size, modulus, multiplier, inverse }
    }

    fn generate_coprime(n: &BigUint) -> BigUint {
        let mut c = BigUint::from(314159265358979323846264338327950288419u128);
        while c.gcd(n) != BigUint::one() {
            c += BigUint::one();
        }
        c
    }

    fn mod_inverse(a: &BigUint, m: &BigUint) -> Option<BigUint> {
        let (gcd, x, _) = Self::extended_gcd(a, m);
        if gcd != BigUint::one() {
            return None;
        }
        Some(x)
    }

    fn extended_gcd(a: &BigUint, m: &BigUint) -> (BigUint, BigUint, BigUint) {
        let a = BigInt::from(a.clone());
        let m = BigInt::from(m.clone());

        let (mut old_r, mut r) = (a.clone(), m.clone());
        let (mut old_s, mut s) = (BigInt::one(), BigInt::zero());

        while !r.is_zero() {
            let q = &old_r / &r;
            let temp_r = old_r - &q * &r;
            old_r = r;
            r = temp_r;

            let temp_s = old_s - &q * &s;
            old_s = s;
            s = temp_s;
        }

        let x = if old_s.is_negative() {
            (old_s % &m + &m) % &m
        } else {
            old_s % &m
        };

        (
            old_r.to_biguint().unwrap(),
            x.to_biguint().unwrap(),
            BigUint::zero(),
        )
    }

    /// content → address (for searching)
    pub fn content_to_address(&self, content: &BigUint) -> BigUint {
        (content * &self.multiplier) % &self.modulus
    }

    /// address → content (for browsing)
    pub fn address_to_content(&self, address: &BigUint) -> BigUint {
        (address * &self.inverse) % &self.modulus
    }

    /// Convert cluster indices to BigUint (base-N encoding)
    pub fn indices_to_biguint(&self, indices: &[usize]) -> BigUint {
        let mut result = BigUint::zero();
        for &idx in indices.iter() {
            result = result * &self.alphabet_size + BigUint::from(idx);
        }
        result
    }

    /// Convert BigUint to cluster indices (base-N decoding)
    pub fn biguint_to_indices(&self, mut num: BigUint, count: usize) -> Vec<usize> {
        let mut indices = vec![0usize; count];
        for i in (0..count).rev() {
            let (q, r) = num.div_rem(&self.alphabet_size);
            indices[i] = r.to_usize().unwrap_or(0);
            num = q;
        }
        indices
    }

    pub fn modulus(&self) -> &BigUint { &self.modulus }
    
    pub fn alphabet_size(&self) -> &BigUint { &self.alphabet_size }
}