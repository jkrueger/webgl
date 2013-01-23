(ns webgl.test.matrix
  (:require [clojure.string :as str]
            [webgl.matrix   :as m]
            [goog.string    :as gstr]
            [goog.vec       :as gvec])
  (:require-macros [webgl.jasmine :as j]))

(def epsilon 0.0001)

(defn cell->str [row cell]
  (-> (aget row cell) (.toFixed 5)))

(defn row->str [matrix i]
  (let [begin (* i 4)
        row   (.subarray matrix begin (+ begin 4))]
    (str/join ", "
              (map (partial cell->str row)
                   (range 4)))))

(defn matrix->str [array]
  (str "["
       (str/join "\n "
                 (map (partial row->str array)
                      (range 4)))
       "]"))

(j/defchecker roughly
  [actual expected]
  (gstr/format
    "Expected value of:\n%s\ndoes not equal actual value:\n%s,\nwith an error tollerance of: %f"
    (matrix->str expected) (matrix->str actual) epsilon)
  (areduce expected i equal? true
    (let [error (- (aget expected i) (aget actual i))]
      (and (< error epsilon)
           (> error (- epsilon))
           equal?))))

(j/describe "When multiplying"
            
  (j/it "two identity matrices, the result should be the identity matrix"
    (j/expect (m/* m/identity m/identity) => (roughly m/identity)))

  (j/it "with identity on the left side the right operand should be preserved"
    (j/expect
      (m/* m/identity
           (m/translation (m/make 1.0 0.0 0.0)))
      => (roughly (m/translation (m/make 1.0 0.0 0.0)))))

  (j/it "with identity on the right side the left operand should be preseved"
    (j/expect
      (m/* (m/translation (m/make 0.1 0.5 1.0))
           m/identity)
      => (roughly (m/translation (m/make 0.1 0.5 1.0))))))

(j/describe "The transpose"
            
  (j/it "of the identity matrix is the identity matrix"
    (j/expect (m/transpose m/identity) => (roughly m/identity)))
  
  (let [to-transpose (m/make 0.0 0.1 0.2 0.3
                             1.1 0.0 0.4 0.5
                             1.2 1.3 0.0 0.6
                             1.4 1.5 1.6 0.0)
        transposed   (m/make 0.0 1.1 1.2 1.4
                             0.1 0.0 1.3 1.5
                             0.2 0.4 0.0 1.6
                             0.3 0.5 0.6 0.0)]
    
    (j/it "of any matrix A is another matrix A' with the rows of A as columns"
      (j/expect (m/transpose to-transpose) => (roughly transposed)))
    
    (j/it "of a transposed matrix is the original matrix"
      (j/expect (m/transpose (m/transpose to-transpose)) => (roughly to-transpose))))

  (j/it "of the multiplication of two matrices is the same as the multiplication of
           the transpose of each individual matrix"
    (let [A (m/x-rotation 1.5)
          B (m/z-rotation 0.8)]
      (j/expect
        (m/transpose (m/* A B)) => (roughly (m/* (m/transpose B) (m/transpose A)))))))

(j/describe "The inverse"

  (j/it "of the identity matrix is the identity matrix"
    (j/expect (m/inverse m/identity) => (roughly m/identity)))

  (j/it "of a matrix multiplied with that matrix is the identity matrix"

    (let [matrices [(m/x-rotation 0.8)
                    (m/* (m/y-rotation 0.32)
                         (m/x-rotation 0.8))
                    (m/* (m/z-rotation 0.95)
                         (m/x-rotation 0.43))
                    (m/*
                     (m/translation 2.43 0.5 8.0)
                     (m/* (m/z-rotation 0.95)
                          (m/x-rotation 0.43)))]]
      (doseq [mat matrices]
        (j/expect (m/* mat (m/inverse mat)) => (roughly m/identity)))))

  (j/it "of a 4x4 matrix should not affect a vector with w set to 0 if only a translation is set"
    (j/expect (m/* (m/inverse (m/translation 4.78 2.1 0.5))
                   (m/make 1.0 1.0 0.0 0.0
                           1.0 1.0 0.0 0.0
                           1.0 1.0 0.0 0.0
                           0.0 1.0 0.0 0.0))
              => (roughly 1.0 (- 4.78) 0.0 0.0 0.0
                          1.0 (- 2.1) 0.0 0.0
                          1.0 (- 0.5) 0.0 0.0
                          0.0 1.0 0.0 0.0))
    (j/expect (m/* (m/inverse (m/*
                               (m/translation 2.43 0.5 8.0)
                               (m/* (m/z-rotation 0.95)
                                    (m/x-rotation 0.43))))
                   (m/make 1.0 0.0 0.0 0.0
                           1.0 0.0 0.0 0.0
                           1.0 0.0 0.0 0.0
                           0.0 0.0 0.0 0.0))
              => (roughly 1.0 0.0 0.0 0.0
                          1.0 0.0 0.0 0.0
                          1.0 0.0 0.0 0.0
                          0.0 0.0 0.0 0.0))

    (j/expect (m/* (m/->rotation
                     (m/inverse (m/* (m/translation 2.43 0.5 8.0)
                                     (m/* (m/z-rotation 0.95)
                                          (m/x-rotation 0.43)))))
                   (m/* (m/z-rotation 0.95) (m/x-rotation 0.43)))
              => (roughly m/identity))))
