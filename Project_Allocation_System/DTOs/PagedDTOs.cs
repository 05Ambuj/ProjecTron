namespace Project_Allocation_System.DTOs
{
    public class PagedDtos
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    public class PagedResponse<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}