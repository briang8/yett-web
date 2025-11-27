const db=require('./db_pg');
(async()=>{
  try{
    await db.query('UPDATE modules SET content_url=$1 WHERE id=$2', ['https://www.w3schools.com/programming/index.php','mod-001']);
    console.log('Updated mod-001');
    await db.query('UPDATE modules SET content_url=$1 WHERE id=$2', ['https://www.netacad.com/courses/introduction-to-cybersecurity?courseLang=en-US','mod-002']);
    console.log('Updated mod-002');
    const rows=await db.query('SELECT id,title,content_url FROM modules ORDER BY created_at');
    console.log('\n== modules ==');
    console.log(JSON.stringify(rows,null,2));
  }catch(e){
    console.error('ERR',e);
    process.exit(1);
  }
  process.exit(0);
})();
