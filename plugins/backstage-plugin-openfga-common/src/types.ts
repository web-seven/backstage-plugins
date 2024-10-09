export type Relations = {
    [key in string]: string[]
};

export type TupleGridData = {
    resources: string[],
    roles: string[],
    relations: Relations
}