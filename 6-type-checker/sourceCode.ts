let name: string;

name = 111;

function add(a: number, b: number): number{
	return a + b;
}
add(1, '2');

function add2<T>(a: T, b: T) {
	return a + b;
}
add2<number>(1, '2');
