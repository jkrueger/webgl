(ns webgl.macros.matrix)

(defn mask [n m i j]
  (fn [x y]
    (let [x (if (>= x i) (inc x) x)
          y (if (>= y j) (inc y) y)]
      (if (fn? m)
        (m x y)
        (let [idx (+ (* y n) x)]
          `(aget ~m ~idx))))))

(declare cofactor*)

(defn det* [n mat]
  (if (= n 1)
    (mat 0 0)
    (letfn [(det-term [i]
              `(* ~(mat 0 i)
                  ~(cofactor* n mat 0 i)))]
      (reduce
        (fn [s i]
          (list '+ s (det-term i)))
        (det-term 0)
        (range 1 n)))))

(defn cofactor* [n mat i j]
  (let [sign   (Math/pow (- 1) (+ i j))
        masked (mask n mat i j)]
    (list 'clojure.core/* sign (det* (dec n) masked))))

(defmacro det
  [n mat]
  (let [mat-sym (gensym "mat")]
    `(let [~mat-sym ~mat]
      ~(det* n (mask n mat-sym n n)))))

(defmacro cofactor [n mat i j]
  (let [mat-sym (gensym "mat")]
    `(let [~mat-sym ~mat]
       ~(cofactor* n mat-sym i j))))

(defmacro cofactors
  [n mat]
  (let [mat-sym (gensym "mat")]
    `(let [~mat-sym ~mat]
       (webgl.matrix/make
         ~@(for [x (range n)
                 y (range n)]
             (cofactor* n mat-sym x y))))))
